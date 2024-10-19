'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IconSearch } from '@tabler/icons-react'; // Make sure to install react-icons

// Sample data structure
const historyItems = [
  { id: 1, title: 'Web Crawl 1', description: 'Analyzed e-commerce sites for pricing trends.' },
  { id: 2, title: 'Social Media Scan', description: 'Gathered sentiment analysis on product launches.' },
  { id: 3, title: 'News Aggregation', description: 'Compiled tech industry news from various sources.' },
  { id: 4, title: 'Competitor Analysis', description: 'Tracked competitor website changes and updates.' },
  { id: 5, title: 'Market Research', description: 'Collected data on emerging market trends.' },
  { id: 6, title: 'Web Crawl 1', description: 'Analyzed e-commerce sites for pricing trends.' },
  { id: 7, title: 'Social Media Scan', description: 'Gathered sentiment analysis on product launches.' },
  { id: 8, title: 'News Aggregation', description: 'Compiled tech industry news from various sources.' },
  { id: 9, title: 'Competitor Analysis', description: 'Tracked competitor website changes and updates.' },
  { id: 10, title: 'Market Research', description: 'Collected data on emerging market trends.' },
  { id: 11, title: 'Web Crawl 1', description: 'Analyzed e-commerce sites for pricing trends.' },
  { id: 12, title: 'Social Media Scan', description: 'Gathered sentiment analysis on product launches.' },
  { id: 13, title: 'News Aggregation', description: 'Compiled tech industry news from various sources.' },
  { id: 14, title: 'Competitor Analysis', description: 'Tracked competitor website changes and updates.' },
  { id: 15, title: 'Market Research', description: 'Collected data on emerging market trends.' },
  { id: 16, title: 'Web Crawl 1', description: 'Analyzed e-commerce sites for pricing trends.' },
  { id: 17, title: 'Social Media Scan', description: 'Gathered sentiment analysis on product launches.' },
  { id: 18, title: 'News Aggregation', description: 'Compiled tech industry news from various sources.' },
  { id: 19, title: 'Competitor Analysis', description: 'Tracked competitor website changes and updates.' },
  { id: 20, title: 'Market Research', description: 'Collected data on emerging market trends.' },
];

function HistoryItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-2 hover:bg-gray-700 transition-colors">
      <h3 className="text-lg font-semibold mb-1 text-white">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}

function Page() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="h-screen w-full flex flex-col  text-white">
      <div className="w-full max-w-3xl mx-auto px-4 pt-8 pb-4 flex-shrink-0">
        <div className="relative mb-6">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search your actions..."
            className="w-full bg-gray-800 rounded-md py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <p className="text-gray-400 mb-4">You have {historyItems.length} previous actions</p>
      </div>

      <div className="relative flex-grow overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto scrollbar-hide">
          <div className="w-full max-w-3xl mx-auto px-4 space-y-2 pb-24">
            {historyItems.map((item) => (
              <HistoryItem key={item.id} title={item.title} description={item.description} />
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-neutral-900 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
}

export default Page;
