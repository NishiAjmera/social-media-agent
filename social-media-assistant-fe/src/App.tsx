import Workflow from './components/Workflow';
import { useState } from 'react';
import './App.css';

function App() {
  const [showLogs, setShowLogs] = useState(false);

  return (
    <>
    <h1>Social Media Assistant</h1>
    <div className="min-h-screen bg-gray-50 flex">
      
      <div className="flex-1 flex justify-center items-top">
        <Workflow showLogs={showLogs} />
      </div>
      {/* <button
        className="fixed top-4 right-4 z-50 bg-white border shadow px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
        onClick={() => setShowLogs((v) => !v)}
      >
        {showLogs ? 'Hide Agent Logs' : 'Show Agent Logs'}
      </button> */}
    </div>
    </>
  
  );
}

export default App;
