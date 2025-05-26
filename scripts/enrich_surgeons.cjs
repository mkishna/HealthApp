require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const BATCH_SIZE = 10;

async function enrichBatch() {
  const { data: surgeons, error } = await supabase
    .from('surgeons')
    .select('surgeon_id, name, profile_url')
    .is('specialties', null)
    .limit(BATCH_SIZE);

  if (error) {
    console.error('❌ Failed to fetch surgeons:', error.message);
    return false;
  }

  if (!surgeons.length) {
    console.log('✅ All surgeons are already enriched.');
    return false;
  }

  for (const surgeon of surgeons) {
    const prompt = `
You are a medical data assistant helping enrich surgeon profiles.

Given the following:

- Name: ${surgeon.name}
- Profile URL: ${surgeon.profile_url}

Return a JSON object with:
- specialties: a list of up to 3 key cosmetic specialties
- languages: list of languages spoken
- trust_score: a number from 1 to 10 based on public profile reputation
`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      });

      let result = response.choices[0].message.content.trim();

      if (result.startsWith('```json')) {
        result = result.replace(/^```json\s*/, '').replace(/```$/, '');
      }

      let json;
      try {
        json = JSON.parse(result);
      } catch (err) {
        console.error(`⚠️ Could not parse GPT response for ${surgeon.name}:`, result);
        continue;
      }

      const { specialties, languages, trust_score } = json;

      const { error: updateError } = await supabase
        .from('surgeons')
        .update({
          specialties: specialties?.join(', ') || null,
          languages: languages?.join(', ') || null,
          trust_score: trust_score || null
        })
        .eq('surgeon_id', surgeon.surgeon_id);

      if (updateError) {
        console.error(`❌ Update failed for ${surgeon.name}:`, updateError.message);
      } else {
        console.log(`✅ Enriched ${surgeon.name}`);
      }

    } catch (err) {
      console.error(`💥 GPT request failed for ${surgeon.name}:`, err.message);
    }
  }

  return true;
}

(async () => {
  while (await enrichBatch()) {
    console.log('🔁 Next batch...');
  }
  console.log('🏁 All done.');
})();
