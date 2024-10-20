'use client';

import { useSearchParams } from 'next/navigation';

export default function TaskPage() {
  const searchParams = useSearchParams();
  const transcription = searchParams?.get('transcription') || 'No transcription available';

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Task</h1>
      <div>
        <h2 className="text-xl font-semibold mb-4">Transcription:</h2>
        <p>{transcription}</p>
      </div>
    </div>
  );
}
