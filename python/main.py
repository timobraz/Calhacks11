import asyncio
import time
import selenium
from kafka import KafkaConsumer, KafkaProducer
from kafka.admin import KafkaAdminClient, NewTopic


consumer = KafkaConsumer("requests_topic")
producer = KafkaProducer(bootstrap_servers="localhost:9092")

kafka_admin_client = KafkaAdminClient(
    bootstrap_servers="localhost:9092", client_id="test"
)


for message in consumer:
    print("message", message)
