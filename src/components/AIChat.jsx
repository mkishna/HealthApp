import React, { useState } from 'react';

function AIChat({ setFilters, surgeons, setMode }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const extractFiltersFallback = (text) => {
    const lower = text.toLowerCase();
    const specialtyMatch = lower.match(/rhinoplasty|liposuction|facelift|tummy tuck|blepharoplasty|bbl|hair transplant|septoplasty/);
    const langMatch = lower.match(/english|turkish|arabic|spanish|french|german|persian|russian/);
    const cityMatch = lower.match(/istanbul|ankara|izmir|antalya|bursa/);

    return {
      specialty: specialtyMatch ? specialtyMatch[0] : '',
      language: langMatch ? langMatch[0] : '',
      city: cityMatch ? cityMatch[0] : ''
    };
  };

  const handleAsk = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setMode('ai'); // Switch to AI mode

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setError('❌ Missing OpenAI API key.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: `Extract specialty, language, and city from this prompt as JSON.\n\n"${query}"`,
            },
          ],
        }),
      });

      const resData = await res.json();
      const raw = resData.choices?.[0]?.message?.content || '';

      let filters = {};
      try {
        filters = JSON.parse(raw);
      } catch {
        filters = extractFiltersFallback(raw);
      }

      setFilters(filters);

      const matched = surgeons.filter((s) => {
        const matchSpecialty = !filters.specialty || s.specialties?.toLowerCase().includes(filters.specialty.toLowerCase());
        const matchLanguage = !filters.language || s.languages?.toLowerCase().includes(filters.language.toLowerCase());
        const matchCity = !filters.city || s.clinic?.city?.toLowerCase().includes(filters.city.toLowerCase());
        return matchSpecialty && matchLanguage && matchCity;
      });

      if (matched.length === 0) {
        setResponse('❌ No matching surgeons found.');
        return;
      }

      const summaryPrompt = `Summarize the following surgeons based on this query: "${query}".\n\n` +
        matched.slice(0, 5).map((s, i) =>
          `${i + 1}. ${s.name} (${s.clinic?.name}, ${s.clinic?.city}) – Trust Score: ${s.trust_score ?? '-'}`).join('\n');

      const summaryRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'user', content: summaryPrompt }
          ]
        })
      });

      const summaryData = await summaryRes.json();
      const summary = summaryData.choices?.[0]?.message?.content || 'No summary generated.';
      setResponse(summary);
    } catch (e) {
      console.error('🔥 AI Error:', e);
      setError('❌ Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow max-w-4xl mx-auto mb-6 border border-gray-100">
      <h2 className="text-2xl font-semibold mb-3 text-gray-800">Ask AI about surgeons</h2>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. Best rhinoplasty doctor in Istanbul who speaks English"
        className="w-full border border-gray-300 p-3 rounded-md mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        rows={3}
      />
      <button
        onClick={handleAsk}
        disabled={loading || !query}
        className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
      >
        {loading ? 'Asking AI...' : 'Ask AI'}
      </button>

      {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
      {response && (
        <div className="mt-5 bg-gray-50 p-4 rounded border text-sm text-gray-800 whitespace-pre-wrap">
          {response}
        </div>
      )}
    </div>
  );
}

export default AIChat;
