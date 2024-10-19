'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BackgroundBeams } from '../../components/ui/background-beams';
import { TextHoverEffect } from '@/components/ui/text-hover-effect';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';

function Page() {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const router = useRouter();
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`/task?message=${inputValue}`);
  };

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



      <div className="w-full max-w-2xl">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800/30 to-gray-700/30 rounded-lg backdrop-blur-sm"></div>
          <form className="relative flex items-center p-4 rounded-lg" onSubmit={handleSubmit}>
            <Input
              type="text"
              placeholder="Ask spidey a question..."
              className="bg-transparent text-white placeholder-gray-400 flex-grow outline-none h-12 border-none focus-visible:outline-none focus-within:outline-none"
              value={inputValue}
              onChange={handleInputChange}
            />
            <button className="ml-2 text-gray-400 bg-gray-700/50 p-2 rounded-lg">
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
          </form>
        </div>
      </div>
    </div>
  );
}

export default Page;
