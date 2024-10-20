import { Kafka, Consumer, Producer, KafkaMessage } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
});

const admin = kafka.admin();

let consumer: Consumer | null = null;
let producer: Producer | null = null;
const subscribedTopics: Set<string> = new Set();

export const getConsumer = async (): Promise<Consumer> => {
  if (!consumer) {
    consumer = kafka.consumer({ groupId: `my-group-${uuidv4()}`, maxBytes: 1024 * 1024 * 6 });
    await consumer.connect();
  }
  return consumer;
};

export const getProducer = async (): Promise<Producer> => {
  if (!producer) {
    producer = kafka.producer({
    });
    await producer.connect();
  }
  return producer;
};

export async function listTopics() {
  const topics = await admin.listTopics();
  return topics;
}

export async function createTopic(topic: string) {
  await admin.createTopics({
    topics: [{
      topic,
      numPartitions: 3,
      replicationFactor: 1,
      configEntries: [
        { name: 'max.message.bytes', value: '6291456' }, // 6 MB
      ]
    }]
  });
}

export async function sendMessage(topic: string, message: string) {
  const producer = await getProducer();
  await producer.send({
    topic,
    messages: [{ value: message }],
  });
}

export async function deleteTopic(topic: string) {
  await admin.deleteTopics({ topics: [topic] });
  subscribedTopics.delete(topic);
  await updateConsumerSubscriptions();
}

export async function subscribeToTopic(topic: string) {
  console.log("SUBSCRIBING TO TOPIC", topic);
  if (!subscribedTopics.has(topic)) {
    subscribedTopics.add(topic);
    await updateConsumerSubscriptions();
  }
}

async function updateConsumerSubscriptions() {
  const consumer = await getConsumer();
  await consumer.stop();
  await consumer.subscribe({ topics: Array.from(subscribedTopics) });
}

export async function startConsuming(callback?: (message: KafkaMessage, topic: string) => void) {
  const consumer = await getConsumer();
  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (subscribedTopics.has(topic)) {
        console.log(`Received message from topic: ${topic}`);
        if (callback) {
          callback(message, topic);
        }
      } else {
        console.log(`Ignoring message from unsubscribed topic: ${topic}`);
      }
    },
  });
}

export const stopKafkaConnections = async () => {
  if (consumer) {
    await consumer.stop();
    await consumer.disconnect();
    consumer = null;
  }
  if (producer) {
    await producer.disconnect();
    producer = null;
  }
  subscribedTopics.clear();
};
