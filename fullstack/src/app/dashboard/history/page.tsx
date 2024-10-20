'use client';
import React, { useState, useEffect } from 'react';
import { IconSearch } from '@tabler/icons-react'; // Make sure to install react-icons


function HistoryItem({ title, action, uuid }: { title: string; action: string; uuid: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-2 hover:bg-gray-700 transition-colors">
      <h3 className="text-lg font-semibold mb-1 text-white flex items-center gap-2">{title}    <span className="text-sm text-gray-400">{uuid}</span></h3>
      <p className="text-sm text-gray-400">{action}</p>
    </div>
  );
}

function Page() {
  const [searchQuery, setSearchQuery] = useState('');
  const [historyItems, setHistoryItems] = useState([]);

  useEffect( () => {
    const fetchData = async () => {
   const data = await fetch('/api/request')
      .then(response => response.json())

      console.log(data);
      setHistoryItems(data.message.map((item: {raw_json: string}) => JSON.parse(item.raw_json.replaceAll("\\", ""))));
    };
    fetchData();
  }, []);


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

        <p className="text-gray-400 mb-4">You have {historyItems?.length||0} previous actions</p>
      </div>

      <div className="relative flex-grow overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto scrollbar-hide">
          <div className="w-full max-w-3xl mx-auto px-4 space-y-2 pb-24">
            {historyItems?.map((item: any, index: number) => (
              <HistoryItem key={index} title={item.message} action={item.action} uuid={item.uuid} />
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-neutral-900 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
}

export default Page;
// d\":\"task-8b5ebe00-7fb1-46e8-a706-942867dd5a09\",\"action\":\"create_browser\"}"
