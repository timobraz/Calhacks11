import asyncio
import json
from kafka import KafkaConsumer, KafkaProducer
from pipeline import SpiderPipeline

KAFKA_BROKER = "8.tcp.us-cal-1.ngrok.io:16714"  # Use your ngrok address here


async def process_message(message, pipeline: SpiderPipeline, producer: KafkaProducer, consumer: KafkaConsumer):
    message_string = message.value.decode("utf-8")
    message_json = json.loads(message_string)
    tasks = []

    if message_json.get("action") == "navigate":
        url = message_json["message"]
        uuid = message_json.get("uuid")
        tasks.append(pipeline.navigate(url, producer, uuid))

    if message_json.get("action") == "create_browser":
        print("MESSAGE", message_json)
        uuid = message_json["uuid"]
        query = message_json["message"]
        print(uuid, query, "creating browser")
        producer.send(
            uuid,
            json.dumps(
                {
                    "message": f"Created Spidey browser",
                    "preview": None,
                    "display": True,
                }
            ).encode("utf-8"),
        )
        tasks.append(pipeline.run(query, producer, consumer, uuid))
        tasks.append(pipeline.take_screenshots(producer, uuid))

    if tasks:
        asyncio.gather(*tasks)


async def consume_messages(consumer, pipeline, producer):
    while True:
        messages = consumer.poll(timeout_ms=1000)
        tasks = []
        for topic_partition, msgs in messages.items():
            for message in msgs:
                tasks.append(process_message(message, pipeline, producer, consumer))
        if tasks:
            await asyncio.gather(*tasks)
        await asyncio.sleep(0.1)  # Small delay to prevent CPU overuse


async def main():
    consumer = KafkaConsumer(
        "requests_topic",
        bootstrap_servers=[KAFKA_BROKER],
    )
    producer = KafkaProducer(
        bootstrap_servers=[KAFKA_BROKER],
    )
    pipeline = SpiderPipeline()
    print("READY FOR REQUESTS")

    await consume_messages(consumer, pipeline, producer)


if __name__ == "__main__":
    asyncio.run(main())
