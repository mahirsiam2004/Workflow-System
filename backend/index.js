const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
// If you are using Node.js < 20.6.0, you need 'dotenv'. 
// If > 20.6.0, you can run with `node --env-file=.env index.js` but strict commonjs might differ.
// We will try to require it, if it fails, it might need installation.
try {
    require('dotenv').config();
} catch (e) {
    // dotenv not installed, hopefully env vars are loaded another way or Node native support
    console.log("dotenv not found, relying on system env or native support");
}

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error("MONGODB_URI is not defined in .env");
    process.exit(1);
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Backend is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
