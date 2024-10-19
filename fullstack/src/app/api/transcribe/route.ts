// VERSION 4 where the buffer works and accurately gets the input (also outputs logs of the response)
// ------------------------------------------------------------
import { NextRequest, NextResponse } from 'next/server';
import formidable, { Files } from 'formidable';
import { IncomingMessage } from 'http';
import { Readable } from 'stream';
import fs from 'fs/promises'; // Use the promise-based API
import { config } from 'dotenv';

config();

// Ensure that the Deepgram API key is available
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

if (!DEEPGRAM_API_KEY) {
  throw new Error('DEEPGRAM_API_KEY is not set in the environment variables.');
}

// Configure the runtime to use Node.js
export const runtime = "nodejs";

// Helper function to convert NextRequest headers to the expected format
const convertHeaders = (headers: Headers): Record<string, string> => {
  const converted: Record<string, string> = {};
  headers.forEach((value, key) => {
    converted[key] = value;
  });
  return converted;
};

// Helper function to parse the incoming form data
const parseForm = async (req: NextRequest): Promise<{ files: Files }> => {
  const form = formidable({
    multiples: false,
  });

  // Convert NextRequest to a buffer
  const buffer = Buffer.from(await req.arrayBuffer());

  // Create a readable stream from the buffer
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null); // Signal end of the stream

  // Manually create an IncomingMessage-like object
  const newReq = Object.assign(stream, {
    headers: convertHeaders(req.headers),
    method: req.method,
    url: req.url,
  }) as IncomingMessage;

  return new Promise((resolve, reject) => {
    form.parse(newReq, (err, _, files) => {
      if (err) {
        reject(err);
      } else {
        resolve({ files });
      }
    });
  });
};

// Function to send the audio data to Deepgram
const transcribeAudio = async (audioData: Buffer) => {
  try {
    // Send the audio data to Deepgram for transcription
    const response = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/webm', // Adjust based on your audio file type
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
      },
      body: audioData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Deepgram API error: ${response.statusText} - ${errorText}`);
      throw new Error(`Deepgram API error: ${response.statusText}`);
    }

    // Parse the JSON response from Deepgram
    const data = await response.json();

    console.log('Deepgram Response:', JSON.stringify(data, null, 2)); // Log the response for debugging

    // Validate if the transcript exists
    if (
      data &&
      data.results &&
      data.results.channels &&
      data.results.channels[0].alternatives &&
      data.results.channels[0].alternatives[0].transcript
    ) {
      return data;
    } else {
      console.error('Deepgram response structure:', JSON.stringify(data, null, 2));
      throw new Error('Transcript data is missing or malformed');
    }
  } catch (error) {
    console.error('Error during transcription:', error);
    throw error;
  }
};

export async function POST(req: NextRequest) {
  let audioPath = '';
  try {
    // Parse the incoming form to extract files
    const { files } = await parseForm(req);

    // Access the uploaded file; assuming the field name is 'file'
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Path to the uploaded file
    audioPath = file.filepath;

    // Read the uploaded audio file as a buffer
    const audioData = await fs.readFile(audioPath);

    // Transcribe the audio
    const transcriptionData = await transcribeAudio(audioData);

    // Return the transcription data to the client
    return NextResponse.json(transcriptionData, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in /api/transcribe:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    // Cleanup: Delete the uploaded file to save disk space
    if (audioPath) {
      try {
        await fs.unlink(audioPath);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }
  }
}

// VERSION 3 where the buffer tries multiple times to get the input
// ------------------------------------------------------------
// import { NextRequest, NextResponse } from 'next/server';
// import formidable, { Files } from 'formidable';
// import { IncomingMessage } from 'http';
// import { Readable } from 'stream';
// import fs from 'fs/promises'; // Use the promise-based API
// import { config } from 'dotenv';

// config();

// // Ensure that the Deepgram API key is available
// const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// if (!DEEPGRAM_API_KEY) {
//   throw new Error('DEEPGRAM_API_KEY is not set in the environment variables.');
// }

// // Configure the runtime to use Node.js
// export const runtime = "nodejs";

// // Helper function to convert NextRequest headers to the expected format
// const convertHeaders = (headers: Headers): Record<string, string> => {
//   const converted: Record<string, string> = {};
//   headers.forEach((value, key) => {
//     converted[key] = value;
//   });
//   return converted;
// };

// // Helper function to parse the incoming form data
// const parseForm = async (req: NextRequest): Promise<{ files: Files }> => {
//   const form = formidable({
//     multiples: false,
//   });

//   // Convert NextRequest to a buffer
//   const buffer = Buffer.from(await req.arrayBuffer());

//   // Create a readable stream from the buffer
//   const stream = new Readable();
//   stream.push(buffer);
//   stream.push(null); // Signal end of the stream

//   // Manually create an IncomingMessage-like object
//   const newReq = Object.assign(stream, {
//     headers: convertHeaders(req.headers),
//     method: req.method,
//     url: req.url,
//   }) as IncomingMessage;

//   return new Promise((resolve, reject) => {
//     form.parse(newReq, (err, _, files) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve({ files });
//       }
//     });
//   });
// };

// // Function to send the audio data to Deepgram with retries
// const transcribeAudio = async (audioData: Buffer, retries: number = 3, delay: number = 1000) => {
//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       // Send the audio data to Deepgram for transcription
//       const response = await fetch('https://api.deepgram.com/v1/listen', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'audio/wav', // Adjust based on your audio file type
//           Authorization: `Token ${DEEPGRAM_API_KEY}`,
//         },
//         body: audioData,
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Deepgram API error: ${response.statusText} - ${errorText}`);
//       }

//       // Parse the JSON response from Deepgram
//       const data = await response.json();

//       // Validate if the transcript exists
//       if (data && data.results && data.results.channels[0].alternatives[0].transcript) {
//         return data; // Return the successful transcription data
//       } else {
//         throw new Error('Transcript data is missing or malformed');
//       }
//     } catch (error) {
//       console.warn(`Attempt ${attempt} failed: ${error.message}`);

//       if (attempt < retries) {
//         // Wait for a short delay before retrying
//         await new Promise((resolve) => setTimeout(resolve, delay));
//       } else {
//         // If all retries fail, throw the error
//         throw new Error('Failed to retrieve transcript after multiple attempts');
//       }
//     }
//   }
// };

// export async function POST(req: NextRequest) {
//   let audioPath = '';
//   try {
//     // Parse the incoming form to extract files
//     const { files } = await parseForm(req);

//     // Access the uploaded file; assuming the field name is 'file'
//     const file = Array.isArray(files.file) ? files.file[0] : files.file;

//     if (!file) {
//       return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
//     }

//     // Path to the uploaded file
//     audioPath = file.filepath;

//     // Read the uploaded audio file as a buffer
//     const audioData = await fs.readFile(audioPath);

//     // Transcribe the audio with retry logic
//     const transcriptionData = await transcribeAudio(audioData, 3, 2000); // 3 retries with a 2-second delay

//     // Return the transcription data to the client
//     return NextResponse.json(transcriptionData, { status: 200 });
//   } catch (error: unknown) {
//     console.error('Error in /api/transcribe:', error);
//     return NextResponse.json({ error: (error as Error).message }, { status: 500 });
//   } finally {
//     // Cleanup: Delete the uploaded file to save disk space
//     if (audioPath) {
//       try {
//         await fs.unlink(audioPath);
//       } catch (err) {
//         console.error('Error deleting file:', err);
//       }
//     }
//   }
// }




// VERSION 2 where the buffer works but many times it can't accurately get the input
// ------------------------------------------------------------
// import { NextRequest, NextResponse } from 'next/server';
// import formidable, { Files } from 'formidable';
// import { IncomingMessage } from 'http';
// import { Readable } from 'stream';
// import fs from 'fs/promises'; // Use the promise-based API
// import { config } from 'dotenv';

// config();

// // Ensure that the Deepgram API key is available
// const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// if (!DEEPGRAM_API_KEY) {
//   throw new Error('DEEPGRAM_API_KEY is not set in the environment variables.');
// }

// // Configure the runtime to use Node.js
// export const runtime = "nodejs";

// // Helper function to convert NextRequest headers to the expected format
// const convertHeaders = (headers: Headers): Record<string, string> => {
//   const converted: Record<string, string> = {};
//   headers.forEach((value, key) => {
//     converted[key] = value;
//   });
//   return converted;
// };

// // Helper function to parse the incoming form data
// const parseForm = async (req: NextRequest): Promise<{ files: Files }> => {
//   const form = formidable({
//     multiples: false,
//   });

//   // Convert NextRequest to a buffer
//   const buffer = Buffer.from(await req.arrayBuffer());

//   // Create a readable stream from the buffer
//   const stream = new Readable();
//   stream.push(buffer);
//   stream.push(null); // Signal end of the stream

//   // Manually create an IncomingMessage-like object
//   const newReq = Object.assign(stream, {
//     headers: convertHeaders(req.headers),
//     method: req.method,
//     url: req.url,
//   }) as IncomingMessage;

//   return new Promise((resolve, reject) => {
//     form.parse(newReq, (err, _, files) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve({ files });
//       }
//     });
//   });
// };

// export async function POST(req: NextRequest) {
//   let audioPath = '';
//   try {
//     // Parse the incoming form to extract files
//     const { files } = await parseForm(req);

//     // Access the uploaded file; assuming the field name is 'file'
//     const file = Array.isArray(files.file) ? files.file[0] : files.file;

//     if (!file) {
//       return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
//     }

//     // Path to the uploaded file
//     audioPath = file.filepath;

//     // Read the uploaded audio file as a buffer
//     const audioData = await fs.readFile(audioPath);

//     // Send the audio data to Deepgram for transcription
//     const response = await fetch('https://api.deepgram.com/v1/listen', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'audio/wav', // Adjust based on your audio file type
//         Authorization: `Token ${DEEPGRAM_API_KEY}`,
//       },
//       body: audioData,
//     });

//     // Check if the Deepgram API responded successfully
//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`Deepgram API error: ${response.statusText} - ${errorText}`);
//     }

//     // Parse the JSON response from Deepgram
//     const data = await response.json();

//     // Check if the transcript is present and valid
//     if (!data || !data.results || !data.results.channels[0].alternatives[0].transcript) {
//       throw new Error('Transcript data is missing or malformed');
//     }

//     // Return the transcription data to the client
//     return NextResponse.json(data, { status: 200 });
//   } catch (error: unknown) {
//     console.error('Error in /api/transcribe:', error);
//     return NextResponse.json({ error: (error as Error).message }, { status: 500 });
//   } finally {
//     // Cleanup: Delete the uploaded file to save disk space
//     if (audioPath) {
//       try {
//         await fs.unlink(audioPath);
//       } catch (err) {
//         console.error('Error deleting file:', err);
//       }
//     }
//   }
// }



// VERSION 1 where the buffer many times doesn't show up but it works
// ------------------------------------------------------------
// import { NextRequest, NextResponse } from 'next/server';
// import formidable, { Files } from 'formidable';
// import { IncomingMessage } from 'http';
// import { Readable } from 'stream';
// import fs from 'fs';
// import { config } from 'dotenv';

// config();

// // Ensure that the Deepgram API key is available
// const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// if (!DEEPGRAM_API_KEY) {
//   throw new Error('DEEPGRAM_API_KEY is not set in the environment variables.');
// }

// // Configure the runtime to use Node.js
// export const runtime = "nodejs";

// // Helper function to convert NextRequest headers to the expected format
// const convertHeaders = (headers: Headers): Record<string, string> => {
//   const converted: Record<string, string> = {};
//   headers.forEach((value, key) => {
//     converted[key] = value;
//   });
//   return converted;
// };

// // Helper function to parse the incoming form data
// const parseForm = async (req: NextRequest): Promise<{ files: Files }> => {
//   const form = formidable({
//     multiples: false, // Adjust based on your requirements
//   });

//   // Convert NextRequest to a buffer
//   const buffer = Buffer.from(await req.arrayBuffer());

//   // Create a readable stream from the buffer
//   const stream = new Readable();
//   stream.push(buffer);
//   stream.push(null); // Signal end of the stream

//   // Manually create an IncomingMessage-like object
//   const newReq = Object.assign(stream, {
//     headers: convertHeaders(req.headers),
//     method: req.method,
//     url: req.url,
//   }) as IncomingMessage;

//   return new Promise((resolve, reject) => {
//     form.parse(newReq, (err, _, files) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve({ files });
//       }
//     });
//   });
// };

// export async function POST(req: NextRequest) {
//   let audioPath = '';
//   try {
//     // Parse the incoming form to extract files
//     const { files } = await parseForm(req);

//     // Access the uploaded file; assuming the field name is 'file'
//     const file = Array.isArray(files.file) ? files.file[0] : files.file;

//     if (!file) {
//       return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
//     }

//     // Path to the uploaded file
//     audioPath = file.filepath;

//     // Read the uploaded audio file
//     const audioData = fs.readFileSync(audioPath);

//     // Send the audio data to Deepgram for transcription
//     const response = await fetch('https://api.deepgram.com/v1/listen', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'audio/wav', // Adjust based on your audio file type
//         Authorization: `Token ${DEEPGRAM_API_KEY}`,
//       },
//       body: audioData,
//     });

//     // Check if the Deepgram API responded successfully
//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`Deepgram API error: ${response.statusText} - ${errorText}`);
//     }

//     // Parse the JSON response from Deepgram
//     const data = await response.json();

//     // Return the transcription data to the client
//     return NextResponse.json(data, { status: 200 });
//   } catch (error: unknown) {
//     console.error('Error in /api/transcribe:', error);
//     return NextResponse.json({ error: (error as Error).message }, { status: 500 });
//   } finally {
//     // Cleanup: Delete the uploaded file to save disk space
//     if (audioPath && fs.existsSync(audioPath)) {
//       fs.unlink(audioPath, (err) => {
//         if (err) {
//           console.error('Error deleting file:', err);
//         }
//       });
//     }
//   }
// }