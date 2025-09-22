import { MongoClient } from 'mongodb';
let client: MongoClient | null = null;

export async function getMongoClient(): Promise<MongoClient> {
	if (!client) {
		client = new MongoClient(process.env.MONGODB_URI || '', {});
		await client.connect();
	}
	return client;
}
