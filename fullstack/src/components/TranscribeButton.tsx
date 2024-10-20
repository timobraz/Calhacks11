"use client";
import { useState, useRef, useCallback, useEffect } from 'react';

interface DeepgramResponse {
  results: {
    channels: {
      alternatives: {
        transcript: string;
      }[];
    }[];
  };
}

interface TranscribeButtonProps {
  setInputValue: (value: string) => void;
}

export default function TranscribeButton({ setInputValue }: TranscribeButtonProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const handleDataAvailable = useCallback(async (event: BlobEvent) => {
    setIsProcessing(true);
    setError(null); // Reset previous errors
    const audioBlob = event.data;
    await uploadAndTranscribe(audioBlob);
    setIsProcessing(false);
  }, []);

  const toggleRecording = useCallback(() => {
    const startRecording = () => {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          audioStreamRef.current = stream;
          const options: MediaRecorderOptions = { mimeType: 'audio/webm' };
          mediaRecorderRef.current = new MediaRecorder(stream, options);

          mediaRecorderRef.current.ondataavailable = handleDataAvailable;
          mediaRecorderRef.current.onstop = () => {
          };

          mediaRecorderRef.current.start();
          setIsRecording(true);
          setInputValue(''); // Clear previous input value
        })
        .catch(error => {
          console.error('Error accessing microphone:', error);
          setError('Microphone access denied. Please allow microphone access.');
        });
    };

    const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }
    };

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, handleDataAvailable, setInputValue]);

  const uploadAndTranscribe = async (audioBlob: Blob) => {
    const formData = new FormData();

    // Determine the file extension based on the blob's MIME type
    const mimeType = audioBlob.type;
    let fileExtension = 'wav'; // Default to 'wav'

    if (mimeType === 'audio/webm') {
      fileExtension = 'webm';
    } else if (mimeType === 'audio/ogg') {
      fileExtension = 'ogg';
    }

    formData.append('file', audioBlob, `recording.${fileExtension}`);

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error: ${response.status} ${errorText}`);
      }

      const data: DeepgramResponse = await response.json();
      const transcription = data.results?.channels[0]?.alternatives[0]?.transcript || '';
      setInputValue(transcription); // Set the transcribed text as the input value
    } catch (error: unknown) {
      console.error('Error uploading file:', error instanceof Error ? error.message : String(error));
      setInputValue('Error transcribing audio. Please try again.');
      setError('Failed to transcribe audio.');
    }
  };

  const handleButtonClick = useCallback(() => {
    if (!isProcessing) {
      toggleRecording();
    }
  }, [isProcessing, toggleRecording]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div>
      <button 
        onClick={handleButtonClick} 
        disabled={isProcessing}
        style={{ 
          backgroundColor: isRecording ? 'red' : 'green', 
          color: 'white', 
          padding: '10px 20px', 
          border: 'none', 
          borderRadius: '5px' 
        }}
        aria-pressed={isRecording}
        aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      {isRecording && <p style={{ color: 'red' }}>Recording...</p>}
      {isProcessing && <p>Processing audio...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}



// "use client";
// import { useState, useRef, useCallback, useEffect } from 'react';

// interface DeepgramResponse {
//   results: {
//     channels: {
//       alternatives: {
//         transcript: string;
//       }[];
//     }[];
//   };
// }

// export default function TranscribeButton() {
//   const [isRecording, setIsRecording] = useState<boolean>(false);
//   const [transcript, setTranscript] = useState<string>('');
//   const [isProcessing, setIsProcessing] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const audioStreamRef = useRef<MediaStream | null>(null);

//   const handleDataAvailable = useCallback(async (event: BlobEvent) => {
//     setIsProcessing(true);
//     setError(null); // Reset previous errors
//     const audioBlob = event.data;
//     await uploadAndTranscribe(audioBlob);
//     setIsProcessing(false);
//   }, []);

//   const toggleRecording = useCallback(() => {
//     const startRecording = () => {
//       navigator.mediaDevices.getUserMedia({ audio: true })
//         .then(stream => {
//           audioStreamRef.current = stream;
//           const options: MediaRecorderOptions = { mimeType: 'audio/webm' };
//           mediaRecorderRef.current = new MediaRecorder(stream, options);

//           mediaRecorderRef.current.ondataavailable = handleDataAvailable;
//           mediaRecorderRef.current.onstop = () => {
//             // Optional: Handle actions after recording stops
//           };

//           mediaRecorderRef.current.start();
//           setIsRecording(true);
//           setTranscript(''); // Clear previous transcript
//         })
//         .catch(error => {
//           console.error('Error accessing microphone:', error);
//           setError('Microphone access denied. Please allow microphone access.');
//         });
//     };

//     const stopRecording = () => {
//       if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//         mediaRecorderRef.current.stop();
//         setIsRecording(false);
//       }
//       if (audioStreamRef.current) {
//         audioStreamRef.current.getTracks().forEach(track => track.stop());
//         audioStreamRef.current = null;
//       }
//     };

//     if (isRecording) {
//       stopRecording();
//     } else {
//       startRecording();
//     }
//   }, [isRecording, handleDataAvailable]);

//   const uploadAndTranscribe = async (audioBlob: Blob) => {
//     const formData = new FormData();

//     // Determine the file extension based on the blob's MIME type
//     const mimeType = audioBlob.type;
//     let fileExtension = 'wav'; // Default to 'wav'

//     if (mimeType === 'audio/webm') {
//       fileExtension = 'webm';
//     } else if (mimeType === 'audio/ogg') {
//       fileExtension = 'ogg';
//     }

//     formData.append('file', audioBlob, `recording.${fileExtension}`);

//     try {
//       const response = await fetch('/api/transcribe', {
//         method: 'POST',
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Error: ${response.status} ${errorText}`);
//       }

//       const data: DeepgramResponse = await response.json();
//       const transcription = data.results?.channels[0]?.alternatives[0]?.transcript || '';
//       setTranscript(transcription);
//     } catch (error: unknown) {
//       console.error('Error uploading file:', error instanceof Error ? error.message : String(error));
//       setTranscript('Error transcribing audio. Please try again.');
//       setError('Failed to transcribe audio.');
//     }
//   };

//   const handleButtonClick = useCallback(() => {
//     if (!isProcessing) {
//       toggleRecording();
//     }
//   }, [isProcessing, toggleRecording]);

//   useEffect(() => {
//     return () => {
//       if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//         mediaRecorderRef.current.stop();
//       }
//       if (audioStreamRef.current) {
//         audioStreamRef.current.getTracks().forEach(track => track.stop());
//       }
//     };
//   }, []);

//   return (
//     <div>
//       <button 
//         onClick={handleButtonClick} 
//         disabled={isProcessing}
//         style={{ 
//           backgroundColor: isRecording ? 'red' : 'green', 
//           color: 'white', 
//           padding: '10px 20px', 
//           border: 'none', 
//           borderRadius: '5px' 
//         }}
//         aria-pressed={isRecording}
//         aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
//       >
//         {isRecording ? 'Stop Recording' : 'Start Recording'}
//       </button>
//       {isRecording && <p style={{ color: 'red' }}>Recording...</p>}
//       {isProcessing && <p>Processing audio...</p>}
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//       {transcript && (
//         <div>
//           <h2>Transcript</h2>
//           <p>{transcript}</p>
//         </div>
//       )}
//     </div>
//   );
// }