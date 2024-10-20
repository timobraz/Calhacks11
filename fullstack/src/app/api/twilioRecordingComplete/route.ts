// app/api/transcribe/route.js (for App Router)

// Import the Deepgram SDK
import { createClient } from '@deepgram/sdk';
import { NextRequest, NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import twilio from 'twilio';
import { setLatestTranscription } from '@/lib/transcriptionStore';

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
} else {
  console.error('ffmpeg-static package not found. Please install it.');
}

// Create a Deepgram client instance
const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
console.log('Deepgram client deepgram', process.env.DEEPGRAM_API_KEY);
async function transcribeAudio(recordingSID: string) {
  try {
    const options = {
      punctuate: true,
      tier: 'enhanced',
    };
    const recording = await twilioClient.recordings(recordingSID).fetch();
    const transcribe = recording.mediaUrl;
    const splitUrl = transcribe.split('://');
    const finalUrl = `https://${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}@${splitUrl[1]}`;
    console.log('Final URL:', finalUrl);
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl({ url: finalUrl }, options);

    if (error) {
      console.error('Deepgram transcription error:', error);
      throw new Error('Transcription failed');
    }

    return result.results?.channels[0]?.alternatives[0]?.transcript;
  } catch (error) {
    console.error('Error during transcription:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse the form data from Twilio
    const formData = await req.formData();
    const recordingSid = formData.get('RecordingSid') as string;

    if (!recordingSid) {
      return NextResponse.json({ error: 'No RecordingSid provided' }, { status: 400 });
    }

    const transcription = await transcribeAudio(recordingSid);

    // Store the latest transcription
    setLatestTranscription(transcription);

    return NextResponse.json({ success: true, transcription });
  } catch (error) {
    console.error('Error during transcription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
