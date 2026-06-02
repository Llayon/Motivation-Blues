import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10"
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function validateTelegramData(initData: string, botToken: string): any {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  const dataCheckString = Array.from(urlParams.entries())
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  const secretKey = hmac("sha256", "WebAppData", botToken, "utf8", "hex");
  const calculatedHash = hmac("sha256", secretKey, dataCheckString, "hex", "hex");

  if (calculatedHash !== hash) {
    throw new Error('Invalid Telegram signature');
  }

  const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) { // 24 hours
    throw new Error('Telegram data is outdated');
  }

  const userString = urlParams.get('user');
  if (!userString) throw new Error('No user data found');
  
  return JSON.parse(userString);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { initData } = await req.json()
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured on the server')
    }

    // 1. Validate the Telegram data
    const tgUser = validateTelegramData(initData, botToken)

    // 2. Setup Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // 3. Generate deterministic credentials for this Telegram user
    const email = `tma_${tgUser.id}@motivation-blues.local`
    // Generate a secure, deterministic password so the client can log in
    const password = hmac("sha256", botToken, tgUser.id.toString(), "utf8", "hex").toString()

    // 4. Ensure the user exists in Supabase Auth
    const { data: { users }, error: searchError } = await supabase.auth.admin.listUsers()
    
    let userExists = users.some((u: any) => u.email === email);

    if (!userExists) {
      const { error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          telegram_id: tgUser.id,
          first_name: tgUser.first_name,
          username: tgUser.username
        }
      })
      if (createError) throw createError
    }

    // 5. Return credentials to the client
    return new Response(
      JSON.stringify({ email, password }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
