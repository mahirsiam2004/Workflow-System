const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

try {
    require('dotenv').config();
} catch (e) {
    console.log("dotenv not found, relying on system env or native support");
}

// Import models
const User = require('./models/User');
const Project = require('./models/Project');
const Request = require('./models/Request');
const Task = require('./models/Task');
const Submission = require('./models/Submission');

// Import middleware
const authMiddleware = require('./middleware/auth');
const roleCheck = require('./middleware/roleCheck');

// Import utilities
const gridfs = require('./utils/gridfs');

// Import routes
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const projectsRoutes = require('./routes/projects.routes');
const requestsRoutes = require('./routes/requests.routes');
const tasksRoutes = require('./routes/tasks.routes');
const submissionsRoutes = require('./routes/submissions.routes');

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

// Create a MongoClient
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db;
let models = {};

async function run() {
    try {
        // Connect to MongoDB
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("✅ Successfully connected to MongoDB!");

        // Get database
        db = client.db(process.env.DB_NAME || 'marketplace-workflow');

        // Initialize GridFS
        gridfs.initGridFS(db);
        console.log("✅ GridFS initialized");

        // Initialize models
        models.user = new User(db);
        models.project = new Project(db);
        models.request = new Request(db);
        models.task = new Task(db);
        models.submission = new Submission(db);
        console.log("✅ Models initialized");

        // Create auth middleware instance
        const auth = authMiddleware(models.user);

        // Register routes
        app.use('/api/auth', authRoutes(models.user, auth));
        app.use('/api/users', usersRoutes(models.user, auth, roleCheck));
        app.use('/api/projects', projectsRoutes(models.project, auth, roleCheck));
        app.use('/api/requests', requestsRoutes(models.request, models.project, auth, roleCheck));
        app.use('/api/tasks', tasksRoutes(models.task, models.project, auth, roleCheck));
        app.use('/api/submissions', submissionsRoutes(
            models.submission,
            models.task,
            models.project,
            auth,
            roleCheck,
            gridfs
        ));
        console.log("✅ Routes registered");

    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
        process.exit(1);
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.json({
        message: 'Marketplace Workflow API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            projects: '/api/projects',
            requests: '/api/requests',
            tasks: '/api/tasks',
            submissions: '/api/submissions'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
});
