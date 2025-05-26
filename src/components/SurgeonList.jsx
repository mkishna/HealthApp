import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function SurgeonList({ mode, filters }) {
  const [surgeons, setSurgeons] = useState([]);
  const [allSurgeons, setAllSurgeons] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [sortOption, setSortOption] = useState('trust_score');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('surgeons')
        .select(`
          surgeon_id, name, profile_url, profile_image_url, specialties, languages, trust_score, social_media_score,
          clinic:clinic_id (name, city, country)
        `);

      if (!error && data) {
        setAllSurgeons(data);
        const specialtySet = new Set();
        const languageSet = new Set();

        data.forEach((s) => {
          s.specialties?.split(',').forEach((sp) => specialtySet.add(sp.trim()));
          s.languages?.split(',').forEach((lang) => languageSet.add(lang.trim()));
        });

        setSpecialties([...specialtySet].sort());
        setLanguages([...languageSet].sort());
      } else {
        console.error('❌ Error loading surgeons:', error);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = allSurgeons;

    if (mode === 'manual') {
      filtered = filtered.filter((s) => {
        const matchSpecialty = !selectedSpecialty || s.specialties?.toLowerCase().includes(selectedSpecialty.toLowerCase());
        const matchLanguage = !selectedLanguage || s.languages?.toLowerCase().includes(selectedLanguage.toLowerCase());
        return matchSpecialty && matchLanguage;
      });
    }

    if (mode === 'ai' && filters) {
      const { specialty, language, city } = filters;
      filtered = filtered.filter((s) => {
        const specialtyText = s.specialties?.toLowerCase() || '';
        const languageText = s.languages?.toLowerCase() || '';
        const cityText = s.clinic?.city?.toLowerCase() || '';

        const matchSpecialty = !specialty || specialtyText.includes(specialty.toLowerCase());
        const matchLanguage = !language || languageText.includes(language.toLowerCase());
        const matchCity = !city || cityText.includes(city.toLowerCase());

        return matchSpecialty && matchLanguage && matchCity;
      });
    }

    filtered.sort((a, b) => {
      if (sortOption === 'name') return a.name.localeCompare(b.name);
      if (sortOption === 'clinic') return (a.clinic?.name || '').localeCompare(b.clinic?.name || '');
      return (b.trust_score || 0) - (a.trust_score || 0);
    });

    setSurgeons(filtered);
  }, [selectedSpecialty, selectedLanguage, sortOption, allSurgeons, mode, filters]);

  return (
    <div className="max-w-6xl mx-auto px-4">
      {mode === 'manual' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block mb-1 font-medium">Specialty</label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="">All</option>
              {specialties.map((sp, idx) => (
                <option key={idx} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="">All</option>
              {languages.map((lang, idx) => (
                <option key={idx} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Sort By</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="trust_score">Trust Score</option>
              <option value="name">Name</option>
              <option value="clinic">Clinic Name</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500">Loading surgeons...</p>
      ) : (
        <>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {surgeons.map((s) => (
              <div
                key={s.surgeon_id}
                className="rounded-2xl border border-gray-200 shadow-sm bg-white p-5 hover:shadow-md transition"
              >
                <div className="flex items-start mb-3">
                  <img
                    src={s.profile_image_url || 'https://i.pravatar.cc/150?u=default'}
                    alt={`${s.name}'s profile`}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h2 className="text-lg font-semibold text-gray-900 truncate">{s.name}</h2>
                      <span
                        className={`text-xs text-white px-2 py-1 rounded-full font-semibold shrink-0 ${
                          s.trust_score >= 9
                            ? 'bg-green-500'
                            : s.trust_score >= 7
                            ? 'bg-yellow-400'
                            : 'bg-gray-400'
                        }`}
                        title="Trust Score"
                      >
                        ⭐ {s.trust_score ?? '-'}
                      </span>
                    </div>
                    {s.clinic?.name && (
                      <p className="text-sm text-gray-500 mt-1">
                        {s.clinic.name}, {s.clinic.city || ''} {s.clinic.country}
                      </p>
                    )}
                  </div>
                </div>

                {s.specialties && (
                  <div className="mb-2 text-sm">
                    <div className="font-medium text-gray-700 mb-1">Specialties:</div>
                    <div className="flex flex-wrap gap-1">
                      {s.specialties.split(',').map((sp, i) => (
                        <span
                          key={i}
                          className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full"
                        >
                          {sp.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {s.languages && (
                  <div className="mb-2 text-sm">
                    <div className="font-medium text-gray-700 mb-1">Languages:</div>
                    <div className="flex flex-wrap gap-1">
                      {s.languages.split(',').map((lang, i) => (
                        <span
                          key={i}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          {lang.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <a
                  href={s.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm underline inline-block mt-2"
                >
                  View Profile
                </a>
              </div>
            ))}
          </div>

          {surgeons.length === 0 && !loading && (
            <p className="text-center text-gray-500 mt-8">
              No surgeons match your filters.
            </p>
          )}
        </>
      )}
    </div>
  );
}
