import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { stopKafkaConnections, createTopic } from '@/lib/kafka';
import mysql from 'mysql2/promise';
import fs from 'fs';
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

export async function GET(request: Request) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync(process.env.DB_SSL_CA!),
    },
  });

  try {
    const [rows] = await connection.execute('SELECT * FROM raw_kafka_data');
    return NextResponse.json({ message: rows }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  } finally {
    await connection.end();
  }
}
