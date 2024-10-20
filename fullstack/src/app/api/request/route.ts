import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { stopKafkaConnections, createTopic } from '@/lib/kafka';

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  console.log('Received message:', message);
  const uuid = uuidv4();
  const topicName = `task-${uuid}`;
  const convName = `conv-${uuid}`;

  try {
    await createTopic(topicName, [{ name: 'max.message.bytes', value: '6291456' }]);
    await createTopic(convName);
    console.log(`Topic ${topicName} created successfully`);

    return new Response(JSON.stringify({ uuid: topicName, convId: convName }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in POST request:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// This function will be called when the API route is disposed
export async function DELETE() {
  console.log('Closing Kafka connections');
  await stopKafkaConnections();
  return new Response(null, { status: 204 });
}
