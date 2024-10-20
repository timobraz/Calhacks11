// app/api/transcribe/route.js (for App Router)

// Import the Deepgram SDK
import { createClient } from '@deepgram/sdk';
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { sendMessage, startConsuming, subscribeToTopic } from '@/lib/kafka';

// Create a Deepgram client instance
const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
async function transcribeAudio(recordingSID: string) {
  try {
    const options = {
      punctuate: true,
      tier: 'enhanced',
    };
    const recording = await twilioClient.recordings(recordingSID).fetch();
    const transcribe = recording.mediaUrl;

    const finalUrl = `https://${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}@${transcribe.split('://')[1]}`;
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

    sendMessage('phone_topic', transcription);

    return NextResponse.json({ success: true, transcription });
  } catch (error) {
    console.error('Error during transcription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      await subscribeToTopic('phone_topic');
      console.log(`listening to phone_topic`);

      await startConsuming((kafkaMessage, topic) => {
        console.log('RECEIVED MESSAGE', topic);
        if (topic === 'phone_topic') {
          const responseMessage = JSON.parse(kafkaMessage.value?.toString() || '{}');
          const encodedMessage = new TextEncoder().encode(responseMessage + '\n');
          controller.enqueue(encodedMessage);
        }
      });
    },
    async cancel() {},
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
