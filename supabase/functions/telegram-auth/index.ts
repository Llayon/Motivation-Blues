import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

async function validateTelegramData(initData: string, botToken: string): Promise<any> {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  const dataCheckString = Array.from(urlParams.entries())
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    true,
    ['sign']
  );
  const secretKeyBuffer = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(botToken));
  const signingKey = await crypto.subtle.importKey(
    'raw',
    secretKeyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    true,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    signingKey,
    encoder.encode(dataCheckString)
  );
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (signatureHex !== hash) {
    throw new Error('Invalid Telegram signature');
  }

  const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) {
    // 24 hours
    throw new Error('Telegram data is outdated');
  }

  const userString = urlParams.get('user');
  if (!userString) throw new Error('No user data found');

  return JSON.parse(userString);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN is not configured on the server');
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    // 1. Validate the Telegram data
    const tgUser = await validateTelegramData(initData, botToken);

    // 2. Setup Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 3. Generate deterministic credentials for this Telegram user
    const email = `tma_${tgUser.id}@motivation-blues.local`;

    // Generate a secure, deterministic password so the client can log in
    const encoder = new TextEncoder();
    const pwKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(botToken),
      { name: 'HMAC', hash: 'SHA-256' },
      true,
      ['sign']
    );
    const pwBuffer = await crypto.subtle.sign('HMAC', pwKey, encoder.encode(tgUser.id.toString()));
    const password = Array.from(new Uint8Array(pwBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // 4. Ensure the user exists in Supabase Auth
    const { error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        telegram_id: tgUser.id,
        first_name: tgUser.first_name,
        username: tgUser.username
      }
    });

    if (createError) {
      if (createError.status === 422 || createError.message.includes('already registered')) {
        // User already exists, which is fine.
      } else {
        throw createError;
      }
    }

    // 5. Return credentials to the client
    return new Response(JSON.stringify({ email, password }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (
      message === 'Invalid Telegram signature' ||
      message === 'Telegram data is outdated' ||
      message === 'No user data found'
    ) {
      return new Response(JSON.stringify({ error: message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.error('Internal error in telegram-auth:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
