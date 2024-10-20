import { NextResponse } from 'next/server';
import xmlbuilder from 'xmlbuilder';

export async function POST(req: Request) {
  // TwiML response to handle the call
  const twiml = xmlbuilder
    .create('Response')
    .ele('Say', {}, 'penis penis penis')
    .end({ pretty: true });

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
