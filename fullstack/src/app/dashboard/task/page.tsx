'use client';
import { Input } from '@/components/ui/input';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

function Task() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [browserPreview, setBrowserPreview] = useState('');
  const [uuid, setUuid] = useState('');
  const [convId, setConvId] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [configQuestion, setConfigQuestion] = useState('');
  const [configAnswer, setConfigAnswer] = useState('');
  const effectRan = useRef(false);

  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState('');
  const router = useRouter();

  useEffect(() => {
    setPrompt(searchParams.get('message') || '');
  }, [searchParams]);

  useEffect(() => {
    const fetchInitialResponse = async () => {
      setMessages([{ role: 'user', content: decodeURIComponent(prompt) }]);
      try {
        const response = await fetch('/api/perplexity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: decodeURIComponent(prompt) }),
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
        const { uuid, convId } = await taskResponse.json();
        setUuid(uuid);
        setConvId(convId);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    if (prompt && !effectRan.current) {
      fetchInitialResponse();
      effectRan.current = true;
    }
  }, [prompt]);

  useEffect(() => {
    const streamMessages = async () => {

      console.log('MADE BACKEND');

      const response = await fetch(`/api/request/${uuid}`, {
        method: 'POST',
        body: JSON.stringify({ message: searchParams.get('message') }),
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
            .map((line) => JSON.parse(line.trim()));
          console.log('MESSAGES', messages);
          for (const message of messages) {
            if (message.display === true) {
              setMessages((prev) => [...prev, { role: 'assistant', content: message.message }]);
            }
            if (message.preview) {
              console.log('PREVIEW', message.preview);
              setBrowserPreview(message.preview);
            }
            if ('question' in message) {
              setConfigQuestion(message.question);
              setShowConfig(true);
            }
          }
          currentLine = '';
        }
      }
    };

    streamMessages();

    return () => {
      if (uuid) {
        handleDeleteTask();
      }
    };
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
      let newPrompt = input;
      if (!uuid && prompt) {
        newPrompt = prompt;
        setPrompt('');
      }
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
      if (!uuid) {
        const taskResponse = await fetch('/api/request', {
          method: 'POST',
          body: JSON.stringify({ message: newPrompt }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const { uuid, convId } = await taskResponse.json();
        setUuid(uuid);
        setConvId(convId);
        console.log('UUID', uuid);
        console.log('CONV ID', convId);
      } else {
        await fetch(`/api/request/${convId}`, {
          method: 'PATCH',
          body: JSON.stringify({ message: input, action: 'navigate' }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
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
            <span className="text-teal-400 text-sm">Created a task for Laila</span>
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
        <div className="w-full flex-1 bg-gray-900 p-4 overflow-auto relative ">
          <div className="bg-black rounded-lg p-4  flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Selenium Browser Preview</h2>
              <div className=" space-x-2">
                <button className="p-1 bg-gray-800 rounded">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="h-full w-full flex justify-center items-center relative">
              {browserPreview ? (
                <Image
                  src={`data:image/png;base64,${browserPreview}`}
                  alt="Browser Preview"
                  fill
                  className="object-contain "
                />
              ) : (
                <span className="text-sm text-gray-300 whitespace-pre-wrap">
                  Your browser preview will appear here...
                </span>
              )}
            </div>
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
              <h2 className="text-lg font-semibold text-white mb-4">{configQuestion}</h2>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Answer"
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                  value={configAnswer}
                  onChange={(e) => setConfigAnswer(e.target.value)}
                />
                {/* <Input
                  type="password"
                  placeholder="Password"
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                /> */}
                {/* <Input
                  type="text"
                  placeholder="Additional Info"
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                /> */}
              </div>
              <button
                onClick={() => {
                  setShowConfig(false);
                  fetch(`/api/request/${uuid}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ answer: configAnswer }),
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  });
                }}
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
