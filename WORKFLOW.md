# Marketplace Workflow System - Flow Documentation

## System Overview

This document describes the role hierarchy, project lifecycle, and state transitions in the Marketplace Workflow System.

## Role Hierarchy

### 1. Admin
- **Capabilities:**
  - View all users and projects
  - Assign Buyer role to users
  - No project execution responsibilities
- **Access Level:** Full system access (read-only for projects)

### 2. Buyer
- **Capabilities:**
  - Create projects
  - View incoming requests from problem solvers
  - Assign one problem solver to a project
  - Review task submissions
  - Accept or reject submitted work
- **Access Level:** Own projects and related data

### 3. Problem Solver
- **Capabilities:**
  - Create and manage profile (bio, skills, portfolio)
  - Browse available projects
  - Request to work on projects
  - Once assigned:
    - Create multiple tasks/sub-modules
    - Manage task timelines and metadata
    - Submit completed work as ZIP files per task
- **Access Level:** Own profile, assigned projects, and related tasks

## Project Lifecycle

### State Transitions

```
┌─────────┐
│  OPEN   │ ← Project created by Buyer
└────┬────┘
     │
     │ Problem Solver requests
     │ Buyer accepts request
     ▼
┌─────────────┐
│  ASSIGNED   │ ← Solver assigned to project
└──────┬──────┘
       │
       │ Solver creates first task
       ▼
┌──────────────┐
│ IN_PROGRESS  │ ← At least one task created
└──────┬───────┘
       │
       │ All tasks completed
       ▼
┌──────────────┐
│  COMPLETED   │ ← All tasks accepted by Buyer
└──────────────┘
```

### Detailed Flow

1. **Project Creation (Buyer)**
   - Buyer creates project with:
     - Title
     - Description
     - Budget (optional)
     - Deadline (optional)
   - Status: `open`

2. **Request Phase (Problem Solver)**
   - Problem solvers browse open projects
   - Solver submits request with message
   - Status: `pending` (request)

3. **Assignment Phase (Buyer)**
   - Buyer reviews all requests
   - Buyer selects one solver
   - Project status changes: `open` → `assigned`
   - Other requests automatically rejected

4. **Task Creation Phase (Problem Solver)**
   - Assigned solver creates tasks:
     - Title
     - Description
     - Deadline
   - Project status changes: `assigned` → `in_progress`
   - Task status: `pending`

5. **Task Execution Phase (Problem Solver)**
   - Solver updates task status: `pending` → `in_progress`
   - Solver works on task

6. **Submission Phase (Problem Solver)**
   - Solver submits ZIP file
   - Task status changes: `in_progress` → `submitted`
   - Submission status: `pending`

7. **Review Phase (Buyer)**
   - Buyer downloads and reviews submission
   - Buyer accepts or rejects:
     - **Accept:** Task status → `completed`, Submission status → `accepted`
     - **Reject:** Task status → `in_progress`, Submission status → `rejected`
   - When all tasks are completed → Project status → `completed`

## Task Lifecycle

### State Transitions

```
┌──────────┐
│ PENDING  │ ← Task created
└────┬─────┘
     │
     │ Solver starts work
     ▼
┌──────────────┐
│ IN_PROGRESS  │ ← Solver actively working
└──────┬───────┘
       │
       │ ZIP file submitted
       ▼
┌─────────────┐
│ SUBMITTED   │ ← Waiting for review
└──────┬──────┘
       │
       │ Buyer reviews
       ├─── Accept ───► ┌───────────┐
       │                │ COMPLETED │
       └─── Reject ────► └───────────┘
                         │ IN_PROGRESS │
                         └─────────────┘
```

## Request Lifecycle

### State Transitions

```
┌──────────┐
│ PENDING  │ ← Request submitted
└────┬─────┘
     │
     ├─── Accept ───► ┌──────────┐
     │                 │ ACCEPTED │
     │                 └──────────┘
     │
     └─── Reject ────► ┌──────────┐
                       │ REJECTED │
                       └──────────┘
```

## Submission Lifecycle

### State Transitions

```
┌──────────┐
│ PENDING  │ ← ZIP file uploaded
└────┬─────┘
     │
     ├─── Accept ───► ┌──────────┐
     │                 │ ACCEPTED │
     │                 └──────────┘
     │                 Task → COMPLETED
     │
     └─── Reject ────► ┌──────────┐
                       │ REJECTED │
                       └──────────┘
                       Task → IN_PROGRESS
```

## Key State Transition Rules

1. **Project Status:**
   - `open` → `assigned`: When buyer accepts a request
   - `assigned` → `in_progress`: When first task is created
   - `in_progress` → `completed`: When all tasks are completed

2. **Task Status:**
   - `pending` → `in_progress`: When solver starts work
   - `in_progress` → `submitted`: When ZIP file is uploaded
   - `submitted` → `completed`: When buyer accepts submission
   - `submitted` → `in_progress`: When buyer rejects submission

3. **Request Status:**
   - `pending` → `accepted`: When buyer accepts
   - `pending` → `rejected`: When buyer rejects or another request is accepted

4. **Submission Status:**
   - `pending` → `accepted`: When buyer accepts
   - `pending` → `rejected`: When buyer rejects

## Data Flow

### Project Creation Flow
```
Buyer → POST /api/projects → MongoDB → Response
```

### Request Flow
```
Solver → POST /api/requests → MongoDB → Buyer Notification
```

### Assignment Flow
```
Buyer → PATCH /api/requests/:id/accept → 
  Update Request Status →
  Assign Solver to Project →
  Reject Other Requests →
  Update Project Status
```

### Task Creation Flow
```
Solver → POST /api/tasks → MongoDB → 
  Update Project Status (if first task) →
  Response
```

### Submission Flow
```
Solver → POST /api/submissions (with ZIP) → 
  GridFS Upload →
  Create Submission Record →
  Update Task Status →
  Response
```

### Review Flow
```
Buyer → PATCH /api/submissions/:id/review →
  Update Submission Status →
  Update Task Status →
  Check All Tasks Complete →
  Update Project Status (if all complete) →
  Response
```

## UI State Transitions

### Animated Transitions

1. **Project Status Change:**
   - Smooth color transition
   - Workflow visualization updates
   - Status badge animation

2. **Task Status Change:**
   - Progress bar animation
   - Status badge fade-in
   - Workflow step highlighting

3. **Submission Upload:**
   - Progress bar (0-100%)
   - Success animation
   - Status update animation

4. **Modal Transitions:**
   - Fade in/out
   - Scale animation
   - Backdrop blur

## Security & Access Control

1. **Role-Based Access:**
   - Admin: All users, all projects (read)
   - Buyer: Own projects only
   - Solver: Assigned projects only

2. **Request Validation:**
   - Solver can only request open projects
   - One request per project per solver
   - Buyer can only accept requests for own projects

3. **Task Management:**
   - Only assigned solver can create/update tasks
   - Buyer can view tasks for own projects

4. **Submission Management:**
   - Only assigned solver can submit files
   - Only buyer can review submissions
   - ZIP files only

## Error Handling

1. **Validation Errors:**
   - Required fields missing
   - Invalid file format
   - Invalid status transition

2. **Authorization Errors:**
   - Unauthorized access
   - Role mismatch
   - Ownership verification failed

3. **Business Logic Errors:**
   - Project already assigned
   - Task already submitted
   - Invalid state transition
