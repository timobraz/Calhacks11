import asyncio
import json
from kafka import KafkaConsumer, KafkaProducer
from pipeline import SpiderPipeline


async def process_message(message, pipeline, producer):
    message_string = message.value.decode("utf-8")
    message_json = json.loads(message_string)
    if message_json.get("action") == "create_browser":
        uuid = message_json["uuid"]
        query = message_json["message"]
        print(uuid, query, "creating browser")
        producer.send(
            uuid,
            json.dumps(
                {"message": f"created selenium browser", "preview": None}
            ).encode("utf-8"),
        )
        task1 = asyncio.create_task(pipeline.run(query, producer, uuid))
        task2 = asyncio.create_task(pipeline.take_screenshots(producer, uuid))
        await asyncio.gather(task1, task2)


async def main():
    consumer = KafkaConsumer("requests_topic")
    producer = KafkaProducer(
        bootstrap_servers="localhost:9092", max_request_size=1024 * 1024 * 20
    )
    pipeline = SpiderPipeline()
    print("READY FOR REQUESTS")

    while True:
        messages = consumer.poll(timeout_ms=1000)
        for topic_partition, msgs in messages.items():
            for message in msgs:
                await process_message(message, pipeline, producer)


if __name__ == "__main__":
    asyncio.run(main())
