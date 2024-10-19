import { Deepgram } from '@deepgram/sdk';

const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

if (!deepgramApiKey) {
  throw new Error('DEEPGRAM_API_KEY is not defined in environment variables.');
}

export const deepgram = new Deepgram(deepgramApiKey);