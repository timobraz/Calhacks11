'use client';
import React, { useState, useRef, useEffect } from 'react';
import { BackgroundBeams } from '../../components/ui/background-beams';
import { TextHoverEffect } from '@/components/ui/text-hover-effect';

function Page() {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-black to-gray-900 text-white">
      <BackgroundBeams />
      <TextHoverEffect text="SENSE" />

      <div className="p-6 z-2 relative">
        <div className="mb-4">
          <span className="bg-teal-400 text-black text-xs font-semibold px-2 py-1 rounded-full mr-2">Project</span>
          <span className="text-teal-400 text-sm">Calhacks 11.0 &gt;</span>
        </div>

        <h1 className="text-5xl font-bold mb-4">Let&apos;s crawl the web</h1>
      </div>

      <div className="relative w-full max-w-2xl mb-[120px] z-3 p-6 backdrop-blur-sm bg-white/10 rounded-xl border border-white/20 shadow-lg">
        <div className="relative flex items-center">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Ask spidey a question..."
            className="bg-transparent text-white placeholder-gray-400 flex-grow min-h-[48px] max-h-[200px] border-none focus:outline-none focus:ring-0 resize-none overflow-hidden"
            style={{ height: '48px' }}
          />
          <button className="ml-2 text-gray-400  bg-gray-700/50 p-2 rounded-lg hover:bg-gray-600/50 transition-colors border border-white/20">
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
      </div>
    </div>
  );
}

export default Page;
