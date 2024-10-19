import { NextRequest } from "next/server";
import { v4 as uuidv4 } from 'uuid';
import { stopKafkaConnections, sendMessage, createTopic, listTopics } from "@/lib/kafka";
  

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  console.log("Received message:", message);
  const uuid = uuidv4();
  await createTopic(uuid);

  const topics = await listTopics();
  console.log("Topics:", topics);
  try {
    await sendMessage("requests_topic", JSON.stringify({ message: message, uuid: uuid }));
    return new Response(JSON.stringify({ uuid }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error producing message:", error);
    return new Response(JSON.stringify({ error: "Failed to send message" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

}

// This function will be called when the API route is disposed
export async function DELETE() {
  console.log("Closing Kafka connections");
  await stopKafkaConnections();
  return new Response(null, { status: 204 });
}
