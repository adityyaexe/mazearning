// my-admin-panel/src/lib/mongodb.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please add your MongoDB URI to the .env.local file");
}

/**
 * Options for MongoClient. 
 * `useNewUrlParser` and `useUnifiedTopology` are default in newer MongoDB drivers.
 */
const options = {};

// Global variable to preserve connection across hot reloads in development
let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    // Connect immediately, save the promise globally
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new client instance (serverless safe)
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
