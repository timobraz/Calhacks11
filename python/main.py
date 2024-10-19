import asyncio
import time
from kafka import KafkaConsumer, KafkaProducer
from kafka.admin import KafkaAdminClient, NewTopic


consumer = KafkaConsumer("requests_topic")
producer = KafkaProducer(bootstrap_servers="localhost:9092")


async def main():
    await asyncio.sleep(2)
    for _ in range(100):
        await asyncio.gather(producer.send("requests_topic", b"some_message_bytes"))


main()
for message in consumer:
    print("message", message)
