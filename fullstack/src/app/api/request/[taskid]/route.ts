import { NextRequest } from "next/server";
import { startConsuming, deleteTopic, stopKafkaConnections, subscribeToTopic, sendMessage } from "@/lib/kafka";

export async function POST(req: NextRequest, { params }: { params: { taskid: string } }) {
  const { taskid } = params;
  console.log("Task ID:", taskid);
  const {message} = await req.json();
  await stopKafkaConnections();

  const stream = new ReadableStream({
    async start(controller) {
      await subscribeToTopic(taskid);
      console.log(`Subscribed to topic: ${taskid}`);
      
      await startConsuming((kafkaMessage, topic) => {
          console.log("RECEIVED MESSAGE", topic);
          if (topic === taskid) {
              const responseMessage = JSON.parse(kafkaMessage.value?.toString() || '{}');
              const encodedMessage = new TextEncoder().encode(JSON.stringify(responseMessage) + "\n");
              controller.enqueue(encodedMessage);
            }
        });
        await sendMessage("requests_topic", JSON.stringify({ message: message, uuid: taskid , action: "create_browser"}));
    },
    async cancel() {
      console.log("Stream cancelled for task", taskid);
      await stopKafkaConnections();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { taskid: string } }) {
  const { taskid } = params;
  console.log("Deleting task:", taskid);
  
  try {
    await deleteTopic(taskid);
    
    return new Response(JSON.stringify({ message: `Task ${taskid} deleted successfully` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return new Response(JSON.stringify({ error: "Failed to delete task" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
