# Classic Phrases Motivation Matrix

## Overview
Update the classic phrases in `src/data/classicPhrases.ts` to provide positive, motivating feedback (dopamine hits) to users upon banking a post. The phrases should avoid "bot-like" slang cosplay and instead lean into specific, stylized personas for each author that praise the user's effort, making the content viral and shareable.

## Character Matrix
1. **Pushkin (The Hype Man):** Enthusiastic, praises rhythm and flow. Makes the user feel like a natural talent.
2. **Tolstoy (The Proud Mentor):** Praises the sheer effort, volume, and discipline. Validates the hard work.
3. **Dostoevsky (The Emotional Validator):** Celebrates overcoming the blank page and internal resistance. Every text is a victory over chaos.
4. **Gogol (The Mystical Observer):** Treats the text as something magical, quirky, or slightly mischievous that has come to life.
5. **Chekhov (The Calm Craftsman):** Quiet, professional nod. Praises brevity, clarity, and 'healthy' prose.
6. **Mayakovsky (The Revolutionary):** Loud, punchy, treating the text as a powerful manifesto or a bold statement.
7. **Bulgakov (The Secret Admirer):** Theatrical praise, treating the post as a precious, secret manuscript safe from the flames.

## Implementation Details
1. Target file: `src/data/classicPhrases.ts`.
2. For each of the 7 authors, rewrite the 3 buckets (`short`, `medium`, `long`) to contain 3 phrases each.
3. Ensure every phrase acts as a supportive coach providing a dopamine hit, strictly adhering to their matrix persona.
4. Remove all modern slang (e.g., "братан", "дедлайн", "прокрастинация").