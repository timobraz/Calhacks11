'use client';

import { useState } from 'react';
import { useRouter } from "next/navigation";
import { useEffect } from "react";
function Page() {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <div>Overview Content</div>;
      case 'tasks':
        return <div>Tasks Content</div>;
      case 'analytics':
        return <div>Analytics Content</div>;
      default:
        return <div>Select a tab</div>;
    }
  };

  const router = useRouter();
  useEffect(() => {
    async function fetchMessage() {
    const response = await fetch(`/api/twilioRecordingComplete`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const reader = response.body?.getReader();
      if (!reader) return;
      let currentLine = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        currentLine += new TextDecoder().decode(value);
        if (currentLine.includes('\n')) {
          const messages = currentLine
            .split('\n')
            .filter((item) => Boolean(item))
          router.push(messages[0]);
        }
      }
    }
    fetchMessage();
  }, []);
  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-black to-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-4">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        <nav>
          <ul>
            {['overview', 'tasks', 'analytics'].map((tab) => (
              <li key={tab} className="mb-2">
                <button
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left py-2 px-4 rounded ${
                    activeTab === tab ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h1>
        {renderContent()}
      </div>
    </div>
  );
}

export default Page;
