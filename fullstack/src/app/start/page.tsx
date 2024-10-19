"use client"
import { Input } from '@/components/ui/input'
import React from 'react'

function Page() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
      <div className="mb-4">
        <span className="bg-teal-400 text-black text-xs font-semibold px-2 py-1 rounded-full mr-2">New</span>
        <span className="text-teal-400 text-sm">Calhacks 11.0 &gt;</span>
      </div>
      
      <h1 className="text-5xl font-bold mb-8">Let&apos;s crawl</h1>
      
      <div className="w-full max-w-2xl">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800/30 to-gray-700/30 rounded-lg backdrop-blur-sm"></div>
          <div className="relative flex items-center p-4 rounded-lg">
            <Input 
              type="text" 
              placeholder="Ask spidey a question..."
              className="bg-transparent text-white placeholder-gray-400 flex-grow outline-none h-12 border-none focus-visible:outline-none focus-within:outline-none"
            />
            <button className="ml-2 text-gray-400 bg-gray-700/50 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page
