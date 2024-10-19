import { Kafka, Consumer, Producer, KafkaMessage } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
});

  const admin = kafka.admin();

let consumer: Consumer | null = null;
let producer: Producer | null = null;

export const getConsumer = async (): Promise<Consumer> => {
  if (!consumer) {
    consumer = kafka.consumer({ groupId: `my-group-${uuidv4()}` });
    await consumer.connect();
  }
  return consumer;
};

export const getProducer = async (): Promise<Producer> => {
  if (!producer) {
    producer = kafka.producer();
    await producer.connect();
  }
  return producer;
};

export async function listTopics() {
  const topics = await admin.listTopics();
  return topics;
}

export async function createTopic(topic: string) {
  await admin.createTopics({ topics: [{ topic }] });
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
}

export async function subscribeToTopic(topic: string, fromBeginning: boolean = true) {
  const consumer = await getConsumer();
  await consumer.subscribe({ topic, fromBeginning });
}

export async function startConsuming(callback: (message: KafkaMessage) => void) {
  const consumer = await getConsumer();
  await consumer.run({
    eachMessage: async ({ message }) => {
      callback(message);
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
};
