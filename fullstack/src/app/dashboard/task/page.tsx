'use client';
import { Input } from '@/components/ui/input';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

// Sample data for charts
const readWriteData = [
  { name: 'Jan', reads: 4000, writes: 2400 },
  { name: 'Feb', reads: 3000, writes: 1398 },
  { name: 'Mar', reads: 2000, writes: 9800 },
  { name: 'Apr', reads: 2780, writes: 3908 },
  { name: 'May', reads: 1890, writes: 4800 },
  { name: 'Jun', reads: 2390, writes: 3800 },
];

const latencyData = [
  { name: 'Jan', latency: 35 },
  { name: 'Feb', latency: 28 },
  { name: 'Mar', latency: 42 },
  { name: 'Apr', latency: 30 },
  { name: 'May', latency: 25 },
  { name: 'Jun', latency: 32 },
];

function Task() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [browserPreview, setBrowserPreview] = useState('');
  const [uuid, setUuid] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [configInput, setConfigInput] = useState('');
  const effectRan = useRef(false);

  const searchParams = useSearchParams();
  const message = searchParams?.get('message');
  const router = useRouter();

  useEffect(() => {
    const fetchInitialResponse = async () => {
      if (message && !effectRan.current) {
        setMessages([{ role: 'user', content: decodeURIComponent(message) }]);
        try {
          const response = await fetch('/api/perplexity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: decodeURIComponent(message) }),
          });

          if (!response.ok) {
            throw new Error('Failed to get response from Perplexity API');
          }

          const data = await response.json();
          setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);

          // Now that we have the initial response, we can start the task
          const taskResponse = await fetch('/api/request', {
            method: 'POST',
            body: JSON.stringify({ message: data.response }),
            headers: {
              'Content-Type': 'application/json',
            },
          });
          const { uuid } = await taskResponse.json();
          setUuid(uuid);
        } catch (error) {
          console.error('Error:', error);
        }
        effectRan.current = true;
      }
    };
    fetchInitialResponse();
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
            const messages: { answer: string; preview: string }[] = text
              .split('\n')
              .filter(Boolean)
              .map((line) => JSON.parse(line))
              .map((message) => ({ answer: message.message, preview: message.preview }));
            for (const message of messages) {
              setMessages((prev) => [...prev, { role: 'assistant', content: message.answer }]);
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
        router.push('/start');
      } else {
        console.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    setInput('');

    try {
      const response = await fetch('/api/perplexity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Perplexity API');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleTestButton = () => {
    // Simulate AI deciding whether to show config input
    const needsConfig = Math.random() > 0.5;
    setShowConfig(needsConfig);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white lg:flex-row flex-col w-full rounded-lg overflow-hidden">
      {/* Left side - Chat */}
      <motion.div
        className="w-full lg:w-1/2 flex-1 flex flex-col p-4 border-r border-gray-700/30 backdrop-blur-md bg-white/5 overflow-y-auto"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-4 flex justify-between items-center">
          <div>
            <span className="bg-teal-400/20 text-teal-200 text-xs font-semibold px-2 py-1 rounded-full mr-2 backdrop-blur-sm">
              New
            </span>
            <span className="text-teal-400 text-sm">Created a task for spidey</span>
          </div>
          <button onClick={handleDeleteTask} className="text-red-400 hover:text-red-300 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-4 text-white">Task stream</h1>

        <div className="flex-grow overflow-auto mb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-300">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <span
                className={`inline-block p-2 rounded-lg ${
                  msg.role === 'user' ? 'bg-blue-600/30 backdrop-blur-sm' : 'bg-gray-700/30 backdrop-blur-sm'
                }`}
              >
                {msg.content}
              </span>
            </motion.div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800/30 to-gray-700/30 rounded-lg backdrop-blur-sm"></div>
          <div className="relative flex items-center p-2 rounded-lg">
            <Input
              type="text"
              placeholder="Prompt your next task..."
              className="bg-transparent text-white placeholder-gray-400 flex-grow outline-none h-12 border-none focus-visible:outline-none focus-within:outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="ml-2 text-gray-400 bg-gray-700/50 p-2 rounded-lg hover:bg-gray-600/50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </form>
      </motion.div>

      {/* Right side - Preview, Config, and Charts */}
      <motion.div
        className="w-full lg:w-1/2 flex-1 bg-[#0f0f0f]/50 backdrop-blur-md p-4 overflow-y-auto rounded-lg flex flex-col relative"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Selenium Browser Display */}
        <div className="bg-black/30 rounded-lg p-4 mb-4 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-2">Selenium Browser Preview</h2>
          <div className="bg-gray-800 h-48 rounded-lg flex items-center justify-center">
            {browserPreview ? (
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">{browserPreview}</pre>
            ) : (
              <p className="text-gray-500">Selenium browser preview will appear here...</p>
            )}
          </div>
        </div>

        {/* Configuration Input Section */}
        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-16 left-4 right-4 bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 shadow-lg"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Configuration Required</h2>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Username"
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                />
                <Input
                  type="text"
                  placeholder="Additional Info"
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                />
              </div>
              <button
                onClick={() => setShowConfig(false)}
                className="mt-6 w-full bg-black/10 hover:bg-teal-600 text-white px-4 py-2 rounded-md transition-colors duration-200 ease-in-out backdrop-blur-sm"
              >
                Submit
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Test Button */}
        <motion.button
          onClick={handleTestButton}
          className="absolute bottom-4 right-4 bg-blue-600/80 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-colors duration-200 ease-in-out backdrop-blur-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Test Config
        </motion.button>
      </motion.div>
    </div>
  );
}

export default Task;
