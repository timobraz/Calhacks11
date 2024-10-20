'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function Page() {
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    console.log('Setting up EventSource');
    const eventSource = new EventSource('/api/twilioRecordingComplete');

    eventSource.onopen = () => {
      console.log('EventSource connection opened');
    };

    eventSource.onmessage = (event) => {
      console.log('Received message:', event.data);
      try {
        const transcription = JSON.parse(event.data).value;
        console.log('Parsed transcription:', transcription);

        // Navigate to the task page with the transcription as a query parameter
        router.push(`/dashboard/task?transcription=${encodeURIComponent(transcription)}`);

        // Close the event source after receiving the transcription
        eventSource.close();
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
    };

    return () => {
      console.log('Closing EventSource');
      eventSource.close();
    };
  }, [router]);

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
        <h1 className="text-3xl font-bold mb-6">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
        {renderContent()}
      </div>
    </div>
  );
}

export default Page;
