import { NextRequest } from "next/server";
import { subscribeToTopic, startConsuming, deleteTopic, stopKafkaConnections } from "@/lib/kafka";

export async function GET(req: NextRequest, { params }: { params: { taskid: string } }) {
  const { taskid } = params;
  console.log("Task ID:", taskid);

  const stream = new ReadableStream({
    async start(controller) {
      await subscribeToTopic(taskid, true);
      console.log(`Subscribed to topic: ${taskid}`);
      await startConsuming((kafkaMessage) => {
        const responseMessage = JSON.parse(kafkaMessage.value?.toString() || '{}');
        const encodedMessage = new TextEncoder().encode(JSON.stringify(responseMessage) + "\n");
        controller.enqueue(encodedMessage);
      });
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
      "Transfer-Encoding": "chunked",
    },
  });
}

// This function will be called when a DELETE request is made to this route
export async function DELETE(req: NextRequest, { params }: { params: { taskid: string } }) {
  const { taskid } = params;
  console.log("Deleting task:", taskid);
  
  try {
      await deleteTopic(taskid);
      await stopKafkaConnections();
    
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
