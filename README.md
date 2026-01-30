# Marketplace Workflow System

A role-based project marketplace workflow platform where projects are created by buyers and executed by problem solvers, with clear state transitions, task management, and delivery submission.

## 🎯 Features

### Role-Based System
- **Admin**: Manage users and assign roles
- **Buyer**: Create projects, review proposals, assign solvers, and approve deliverables
- **Problem Solver**: Browse projects, request work, manage tasks, and submit deliverables

### Core Functionality
- ✅ Complete project lifecycle management
- ✅ Role-based access control
- ✅ Task creation and management
- ✅ ZIP file submission and review system
- ✅ Real-time state transitions
- ✅ Smooth animated UI with Framer Motion
- ✅ Firebase Authentication
- ✅ MongoDB database with GridFS for file storage

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Authentication**: Firebase Auth
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Fonts**: Poppins (Google Fonts)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **File Storage**: GridFS
- **Authentication**: Firebase Admin SDK
- **File Upload**: Multer

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account or local MongoDB instance
- Firebase project with Authentication enabled

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd marketplace-workflow
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
DB_NAME=marketplace-workflow
FRONTEND_URL=http://localhost:3000
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

**Note**: To get your Firebase Service Account JSON:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Copy the entire JSON content and paste it as a single-line string in the `.env` file

Start the backend:

```bash
npm start
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Start the frontend:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user in MongoDB
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id/role` - Update user role (Admin only)
- `PATCH /api/users/:id/profile` - Update user profile

### Projects
- `POST /api/projects` - Create project (Buyer only)
- `GET /api/projects` - Get projects (filtered by role)
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project (Buyer only)
- `DELETE /api/projects/:id` - Delete project (Buyer only)

### Requests
- `POST /api/requests` - Create request (Problem Solver only)
- `GET /api/requests/project/:projectId` - Get project requests (Buyer only)
- `PATCH /api/requests/:id/accept` - Accept request (Buyer only)
- `PATCH /api/requests/:id/reject` - Reject request (Buyer only)

### Tasks
- `POST /api/tasks` - Create task (Assigned Solver only)
- `GET /api/tasks/project/:projectId` - Get project tasks
- `PATCH /api/tasks/:id` - Update task (Assigned Solver only)
- `DELETE /api/tasks/:id` - Delete task (Assigned Solver only)

### Submissions
- `POST /api/submissions` - Submit ZIP file (Assigned Solver only)
- `GET /api/submissions/task/:taskId` - Get task submission
- `GET /api/submissions/:id/download` - Download ZIP file
- `PATCH /api/submissions/:id/review` - Review submission (Buyer only)

## 🔄 Project Workflow

1. **Admin assigns Buyer role** to a user
2. **Buyer creates a project** with details
3. **Problem solvers request** to work on the project
4. **Buyer selects one problem solver** and assigns them
5. **Problem solver creates tasks** with metadata (title, description, deadline)
6. **Problem solver submits ZIP files** for each task
7. **Buyer reviews submissions** and accepts/rejects work
8. **Project completes** when all tasks are accepted

## 🎨 Design Features

- **Green Color Palette**: Emerald, Teal, and Green gradients throughout
- **Poppins Font**: Clean, modern typography
- **Smooth Animations**: Framer Motion for state transitions
- **Responsive Design**: Mobile-first approach
- **Micro-interactions**: Hover effects, loading states, and transitions

## 🏗️ Project Structure

```
marketplace-workflow/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth and role check middleware
│   ├── utils/           # GridFS and utilities
│   └── index.js         # Entry point
├── frontend/
│   ├── app/             # Next.js app router pages
│   ├── components/      # Reusable components
│   ├── contexts/        # React contexts (Auth)
│   └── lib/             # Firebase, API client, utilities
└── README.md
```

## 🔐 Security Features

- Firebase Authentication for user management
- JWT token verification on all protected routes
- Role-based access control (RBAC)
- Input validation and sanitization
- Secure file upload (ZIP files only)

## 🚧 Current Status

### ✅ Completed
- Backend API with all endpoints
- Database models and relationships
- Authentication and authorization
- File upload/download with GridFS
- Frontend authentication flow
- Hero section with green color palette
- Login and registration pages
- **Admin Dashboard** - User management and role assignment
- **Buyer Dashboard** - Project creation, request management, submission review
- **Problem Solver Dashboard** - Profile management, project browsing, task management, file submission
- **Animated State Transitions** - Framer Motion animations for all state changes
- **Workflow Visualization** - Visual representation of project and task lifecycles
- **Task Management UI** - Complete task creation, update, and submission flow

## 📝 Notes

- The first user to register will have the default role of `user`
- An admin must manually assign roles through the database or admin panel
- ZIP files are stored in MongoDB using GridFS
- All API routes require authentication except `/api/auth/register`

## 🤝 Contributing

This is a challenge project. For production use, consider:
- Adding comprehensive error handling
- Implementing rate limiting
- Adding email notifications
- Implementing real-time updates with WebSockets
- Adding payment integration
- Implementing search and filtering
- Adding analytics and reporting

## 📄 License

This project is created as part of a technical challenge.

---

**Built with ❤️ using Next.js, Express, MongoDB, and Firebase**
