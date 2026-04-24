# Task-Management Platform (v2.0)

A high-performance, full-stack work management platform built on the **MERN stack**, designed for team-based collaboration at scale. Version 2.0 evolves the application into a professional-grade system comparable to **Jira** or **Asana**, featuring AI-driven insights, real-time collaboration, and a production-ready DevOps pipeline.

---


## Overview

The Enterprise Work-Management Platform provides organizations with a structured, scalable way to manage work across teams and projects. It introduces a robust **Teams → Projects → Tasks** hierarchy, replacing simple task lists with a fully featured workflow engine, Kanban boards, AI assistance, and multi-channel notifications.

---

## Key Features

### Organizational Structure
- **Team Management** — Admins can create and manage specialized teams (e.g., Engineering, HR, Design).
- **Project-Based Tracking** — Tasks are scoped to specific projects within teams, not a single global list.
- **7-Stage Workflow** — Tasks move through: `Backlog` → `Todo` → `In Progress` → `In Review` → `Blocked` → `Completed` → `Archived`.

### Collaboration & Interaction
- **Kanban Board** — Real-time drag-and-drop interface for visual task management.
- **Collaboration Tools** — Task-level comments, user `@mentions`, and detailed activity history logs.
- **Multi-Channel Notifications** — In-app and  Email for assignments, mentions, and deadlines.

### AI Intelligence
- **Auto-Generation** — AI generates task descriptions and subtasks from short user-provided titles.
- **Smart Assignment** — Recommends assignees based on current workload and historical completion speed.
- **Natural Language Search** — Supports conversational queries like *"show me overdue tasks assigned to Kiran."*


---

## Technical Architecture

| Layer | Technology |
|---|---|
| **Frontend** | React, Redux Toolkit (RTK Query), MUI |
| **Backend** | Node.js, Express (Modular Domain-Driven Design) |
| **Database** | MongoDB Atlas |
| **Cache & Real-time** | Upstash Redis & Socket.IO |
| **DevOps** | Docker Compose & GitHub Actions CI/CD |

---

## Local Setup

### Prerequisites

- [Docker Desktop] installed and running
- Valid `.env` files configured for both the Frontend and Backend 

### Running with Docker

```bash
# 1. Clone the repository
git clone https://github.com/Kiranm2002/Task_Management_System.git
cd Task_Management_System

# 2. Start all services
docker-compose up --build
```

Service & URL 

Frontend - http://localhost:5173 
Backend API  - http://localhost:5000 

---

## Production Deployment

### Frontend — Vercel

1. Connect the repository to [Vercel] 
2. Set the environment variable:
   ```
   VITE_APP_URL=https://task-management-system-yip5.onrender.com
   ```

### Backend — Render

1. Connect the repository to [Render](https://render.com).
2. Configure the service:
   - **Root Directory:** `/backend`
   - **Start Command:** `node src/server.js`
3. Setup Environment variables
---


## Author

Developed by **Kiran M**
