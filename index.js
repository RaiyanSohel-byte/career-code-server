const express = require("express");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
app.use(cors());
app.use(express.json());

var admin = require("firebase-admin");

var serviceAccount = require("./firebase-admin-sdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const verifyFirebaseToken = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  try {
    const userInfo = admin.auth().verifyIdToken(token);
    req.token_email = userInfo.email;
    next();
  } catch {
    return res.status(401).send({ message: "unauthorized access" });
  }
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.lyk9xse.mongodb.net/?appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const jobsDB = client.db("jobsDB");
const jobsCollection = jobsDB.collection("jobs");
const applicationsCollection = jobsDB.collection("applications");

async function run() {
  try {
    await client.connect();

    //jobs related api
    app.post("/jobs", async (req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    });
    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        if (email !== req.token_email) {
          return res.status(403).send({ message: "forbidden access" });
        }
        query.email = email;
      }
      const cursor = jobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/latestJobs", async (req, res) => {
      const cursor = jobsCollection.find().sort({ time: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });
    app.delete("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.send(result);
    });
    app.delete("/jobs", async (req, res) => {
      const result = await jobsCollection.deleteMany({});
      res.send(result);
    });
    app.patch("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const updatedJob = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: updatedJob,
      };
      const result = await jobsCollection.updateOne(query, update);
      res.send(result);
    });

    //applications api
    app.post("/applications", async (req, res) => {
      const newApplication = req.body;
      const result = await applicationsCollection.insertOne(newApplication);
      res.send(result);
    });
    app.get("/applications", async (req, res) => {
      const email = req.query.email;
      const query = {};

      if (email) {
        query.email = email;
      }

      const cursor = applicationsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/applications/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await applicationsCollection.findOne(query);
      res.send(result);
    });
    app.patch("/applications/:id", async (req, res) => {
      const id = req.params.id;
      const updatedApplication = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: updatedApplication,
      };
      const result = await applicationsCollection.updateOne(query, update);
      res.send(result);
    });
    app.delete("/applications/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await applicationsCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Mongo DB connected successfully");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});
app.listen(port, () => {
  console.log(`hitting on port ${port}`);
});
