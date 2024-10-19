import { NextResponse } from 'next/server';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ message: 'Prompt is required' }, { status: 400 });
    }

    if (!process.env.PERPLEXITY_API_KEY) {
      console.error('PERPLEXITY_API_KEY is not set');
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    console.log('API Key:', process.env.PERPLEXITY_API_KEY);

    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content:
              'You are part of a system that is designed to navigate webpages and click buttons. You are the one creating instructions for web navigators. Only put the steps that selenium can do and nothing else.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        top_p: 0.9,
        return_citations: true,
        search_domain_filter: ['perplexity.ai'],
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        top_k: 0,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1,
      }),
    };

    const response = await fetch('https://api.perplexity.ai/chat/completions', options);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Perplexity API error:', response.status, errorData);
      return NextResponse.json(
        { message: 'Perplexity API request failed', error: errorData },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({ response: data.choices[0].message.content });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: String(error) }, { status: 500 });
  }
}
