'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BackgroundBeams } from '../../components/ui/background-beams';
import { TextHoverEffect } from '@/components/ui/text-hover-effect';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// Separate component for the textarea
const TextArea = React.memo(({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      placeholder="Ask spidey a question..."
      className="bg-transparent text-white placeholder-gray-400 flex-grow min-h-[48px] max-h-[200px] border-none focus:outline-none focus:ring-0 resize-none overflow-hidden"
      style={{ height: '48px' }}
    />
  );
});

TextArea.displayName = 'TextArea';

function Page() {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`Page rendered ${renderCount.current} times`);
  });

  const router = useRouter();
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`/task?message=${inputValue}`);
  };

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim()) return;

    setIsLoading(true);
    try {
      // Encode the input value to safely include it in the URL
      const encodedInput = encodeURIComponent(inputValue);
      router.push(`/dashboard/task?message=${encodedInput}`);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, router]);

  const letters = "Let's crawl the web".split('');

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-black to-gray-900 text-white">
      <BackgroundBeams />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <TextHoverEffect text="SENSE" />
      </motion.div>

      <motion.div
        className="p-6 z-2 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div className="mb-4">
          <span className="bg-teal-400 text-black text-xs font-semibold px-2 py-1 rounded-full mr-2">Project</span>
          <span className="text-teal-400 text-sm">Calhacks 11.0 &gt;</span>
        </div>

        <h1 className="text-5xl font-bold mb-4 flex">
          {letters.map((letter, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.6 + index * 0.05,
                type: 'spring',
                stiffness: 120,
                damping: 10,
              }}
              whileHover={{
                y: -5,
                color: '#4fd1c5', // teal-400
                transition: { duration: 0.2 },
              }}
              className="inline-block"
            >
              {letter === ' ' ? '\u00A0' : letter}
            </motion.span>
          ))}
        </h1>
      </motion.div>

      <motion.div
        className="relative w-full max-w-2xl mb-[120px] z-3 p-6 backdrop-blur-sm bg-white/10 rounded-xl border border-white/20 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <div className="relative flex items-center">
          <TextArea value={inputValue} onChange={handleInputChange} />
          <motion.button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`ml-2 text-gray-400 bg-gray-700/50 p-2 rounded-lg hover:bg-gray-600/50 transition-colors border border-white/20 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <svg
                className="animate-spin h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </motion.button>
        </div>
        <div className="mt-2 text-sm text-gray-400">Render count: {renderCount.current}</div>
      </motion.div>
    </div>
  );
}

export default Page;
