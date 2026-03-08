import { MongoClient } from "mongodb";

let clientPromise;

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing env: MONGODB_URI");
  if (!clientPromise) {
    const client = new MongoClient(uri, { maxPoolSize: 10 });
    clientPromise = client.connect();
  }
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB || "ministain";
  return client.db(dbName);
}
