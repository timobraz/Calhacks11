'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function ActionPage() {
  const [response, setResponse] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const encodedResponse = searchParams?.get('response');
    if (encodedResponse) {
      setResponse(decodeURIComponent(encodedResponse));
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-gray-900 to-black text-white overflow-x-hidden">
      <div className="w-full max-w-4xl p-8 my-16">
        <h1 className="text-4xl font-bold mb-8 text-center text-teal-400">Perplexity Response</h1>
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-xl overflow-hidden">
          <div className="max-h-[70vh] overflow-y-auto p-6">
            <pre className="whitespace-pre-wrap break-words text-sm">
              {response || 'No response received. Please try again.'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActionPage;
