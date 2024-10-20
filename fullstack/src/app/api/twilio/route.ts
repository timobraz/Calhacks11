import { NextResponse } from 'next/server';
import xmlbuilder from 'xmlbuilder';

export async function POST() {
  const twiml = xmlbuilder
    .create('Response')
    .ele('Say', 'Hey its Laila! Tell me to do anything you need! Press the pound key to end')
    .up()
    .ele('Record', {
      action: '/api/twilioRecordingComplete',
      method: 'POST',
      maxLength: 30, 
      finishOnKey: '#', // End recording when # is pressed
      transcribe: false, // We're handling transcription ourselves
      playBeep: true,
    })
    .up()
    .ele('Say', 'No message recorded. Goodbye.')
    .up()
    .end({ pretty: true });

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
