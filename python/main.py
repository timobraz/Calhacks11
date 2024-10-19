import asyncio
import time
import selenium
from kafka import KafkaConsumer, KafkaProducer
from kafka.admin import KafkaAdminClient, NewTopic

import json


consumer = KafkaConsumer("requests_topic")
producer = KafkaProducer(bootstrap_servers="localhost:9092")

admin_client = KafkaAdminClient(bootstrap_servers="localhost:9092")
print("listening for requests")
for message in consumer:

    message_string = message.value.decode("utf-8")
    message_json = json.loads(message_string)
    print(message_json)
    for i in range(3):
        producer.send(
            message_json["uuid"],
            bytes(
                json.dumps({"message": f"created {i}", "preview": f"preview {i}"}),
                "utf-8",
            ),
        )
        time.sleep(1)
