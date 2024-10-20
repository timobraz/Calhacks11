import { redirect } from 'next/navigation';

let latestTranscription: string | null = null;

export function setLatestTranscription(transcription: string) {
  latestTranscription = transcription;
  console.log('Setting Transcription', latestTranscription);
  const encodedInput = encodeURIComponent(latestTranscription);
  redirect(`/dashboard/task?message=${encodedInput}`);
}

export function getLatestTranscription() {
  console.log('Getting Transcription', latestTranscription);
  return latestTranscription;
}
