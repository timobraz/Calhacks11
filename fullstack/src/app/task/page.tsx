'use client';
import { Input } from '@/components/ui/input';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function Task() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [browserPreview, setBrowserPreview] = useState('');
  const [uuid, setUuid] = useState('');
  const effectRan = useRef(false);
    
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const router = useRouter();

  useEffect(() => {
    
    const fetchMessages = async () => {
      if (message) {
        setMessages([{ role: 'user' as const, content: message }]);
      try {

      const response = await fetch('/api/request', {
        method: 'POST',
        body: JSON.stringify({ message: message }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const uuid = (await response.json()).uuid;
      setUuid(uuid);
      } catch (error) {
        console.error('Error:', error);
      }
      
    }
    };
    if (message && !effectRan.current) {
      fetchMessages();
      effectRan.current = true;
    }
  }, [message]);

  useEffect(() => {
    const stream = async () => {
      try {
      const responseStream = await fetch(`/api/request/${uuid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const reader = responseStream.body?.getReader();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = new TextDecoder().decode(value);
          const messages: {answer: string, preview: string}[] = text.split('\n').filter(Boolean).map((line) => JSON.parse(line)).map((message) => ({answer: message.message, preview: message.preview}));
          for (const message of messages) {
            setMessages(prev => [...prev, { role: 'assistant', content: message.answer }]);
            setBrowserPreview(message.preview || '');
          }
        }
      }

    } catch (error) {
      console.error('Error:', error);
    }
  };
  if (uuid) {
      stream();
    }
  }, [uuid]);

  const handleDeleteTask = async () => {
    try {
      const response = await fetch(`/api/request/${uuid}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('Task deleted successfully');
        router.push('/start'); // Redirect to home page or wherever appropriate
      } else {
        console.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white lg:flex-row flex-col w-full">
      {/* Left side - Chat */}
      <div className="w-full flex-1 flex flex-col p-4 border-r border-gray-700">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <span className="bg-teal-400 text-black text-xs font-semibold px-2 py-1 rounded-full mr-2">New</span>
            <span className="text-teal-400 text-sm">Created a task for spidey</span>
          </div>
          <button 
            onClick={handleDeleteTask}
            className="text-red-500 hover:text-red-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-4">Task stream</h1>

        <div className="flex-grow overflow-auto mb-4">
          {messages.map((msg, index) => (
            <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <span className={`inline-block p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                {msg.content}
              </span>
            </div>
          ))}
        </div>

        <form  className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800/30 to-gray-700/30 rounded-lg backdrop-blur-sm"></div>
          <div className="relative flex items-center p-2 rounded-lg">
            <Input
              type="text"
              placeholder="Prompt your next task..."
              className="bg-transparent text-white placeholder-gray-400 flex-grow outline-none h-12 border-none focus-visible:outline-none focus-within:outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="ml-2 text-gray-400 bg-gray-700/50 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Right side - Preview */}
      <div className="w-full flex-1 bg-gray-900 p-4 overflow-auto">
        <div className="bg-black rounded-lg p-4 h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Preview</h2>
            <div className="flex space-x-2">
              <button className="p-1 bg-gray-800 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
            {browserPreview || 'Your browser preview will appear here...'}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default Task;
