import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB_NAME || "spotify-rec";

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
    }

    if (!db) {
        db = client.db(dbName);
    }

    return { client, db };
}

export async function getDatabase() {
    const { db } = await connectToDatabase();
    return db;
}
