import React, { useState, useEffect } from 'react';
import AIChat from './components/AIChat';
import SurgeonList from './components/SurgeonList';

function App() {
  const [mode, setMode] = useState('manual'); // 'manual' or 'ai'
  const [filters, setFilters] = useState({});
  const [surgeons, setSurgeons] = useState([]);

  // Fetch surgeons from API
  useEffect(() => {
    const fetchSurgeons = async () => {
      try {
        const response = await fetch('/api/surgeons'); // Replace with actual API endpoint
        if (!response.ok) throw new Error('Failed to fetch surgeons');
        
        const data = await response.json();
        setSurgeons(data);
      } catch (error) {
        console.error('❌ Error fetching surgeons:', error);
      }
    };

    fetchSurgeons();
  }, []);

  return (
    <div className="App">
      <AIChat
        setFilters={setFilters}
        surgeons={surgeons}
        setMode={setMode}
      />
      <SurgeonList
        mode={mode}
        filters={filters}
        surgeons={surgeons}
      />
    </div>
  );
}

export default App;
