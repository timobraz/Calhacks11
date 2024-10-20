// app/api/transcribe/route.js (for App Router)

// Import the Deepgram SDK
import { createClient } from '@deepgram/sdk';
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { sendMessage, startConsuming, subscribeToTopic } from '@/lib/kafka';

// Create a Deepgram client instance
const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

async function retryOperation<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying operation. Attempts left: ${retries - 1}`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return retryOperation(operation, retries - 1);
    } else {
      throw error;
    }
  }
}

async function transcribeAudio(recordingSID: string) {
  return retryOperation(async () => {
    const options = {
      punctuate: true,
      tier: 'enhanced',
    };
    const recording = await twilioClient.recordings(recordingSID).fetch();
    const transcribe = recording.mediaUrl;

    if (!transcribe) {
      throw new Error('Media URL not available');
    }

    const finalUrl = `https://${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}@${transcribe.split('://')[1]}`;
    console.log('Final URL:', finalUrl);

    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl({ url: finalUrl }, options);

    if (error) {
      console.error('Deepgram transcription error:', error);
      throw new Error('Transcription failed');
    }

    console.log('Deepgram transcription result:', result.results?.channels[0]?.alternatives[0]?.transcript);

    return result.results?.channels[0]?.alternatives[0]?.transcript;
  });
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
  console.log('GET request received for SSE');
  const stream = new ReadableStream({
    async start(controller) {
      console.log('Starting SSE stream');
      await subscribeToTopic('phone_topic');
      console.log('Subscribed to phone_topic');

      await startConsuming((kafkaMessage, topic) => {
        console.log('RECEIVED KAFKA MESSAGE', topic, kafkaMessage.value?.toString());
        if (topic === 'phone_topic') {
          const transcription = kafkaMessage.value?.toString() || '';
          const message = `data: ${JSON.stringify({ value: transcription })}\n\n`;
          console.log('Sending SSE message:', message);
          const encodedMessage = new TextEncoder().encode(message);
          controller.enqueue(encodedMessage);
        }
      });
    },
    async cancel() {
      console.log('SSE stream cancelled');
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
