# HireFlow 🚀

A modern recruitment management platform that streamlines the hiring process with job distribution across multiple platforms.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Authentication & Roles](#authentication--roles)
- [Job Distribution](#job-distribution)
- [Environment Variables](#environment-variables)

---

## Overview

HireFlow is a full-stack hiring platform that allows recruiters and admins to post, manage, and distribute job listings across multiple job boards including **LinkedIn** and **Indeed**.

---

## Features

- ✅ Job listing creation, editing, and deletion
- ✅ Job status management
- ✅ Role-based access control (Admin, Recruiter, Applicant)
- ✅ Multi-platform job distribution (LinkedIn & Indeed)
- ✅ Indeed XML feed for job crawling
- ✅ JWT-based authentication

---

## Tech Stack

| Layer     | Technology        |
|-----------|-------------------|
| Runtime   | Node.js           |
| Framework | Express.js        |
| Auth      | JWT (JSON Web Tokens) |
| Database  | MongoDB           |
| Routing   | Express Router    |

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/360DMMC-AI-Marketing/HireFlow.git
   cd HireFlow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

---

## API Endpoints

### Public Routes *(No authentication required)*

| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| GET    | `/jobs`           | Get all job listings     |
| GET    | `/jobs/:id`       | Get a specific job       |
| GET    | `/jobs/indeed-feed` | Indeed XML feed (crawled by Indeed) |

### Protected Routes *(Authentication required)*

| Method | Endpoint          | Role Required            | Description              |
|--------|-------------------|--------------------------|--------------------------|
| POST   | `/jobs`           | Admin, Recruiter         | Create a new job         |
| PATCH  | `/jobs/:id`       | Admin, Recruiter         | Update a job             |
| DELETE | `/jobs/:id`       | Admin, Recruiter         | Delete a job             |
| PATCH  | `/jobs/:id/status`| Admin, Recruiter         | Update job status        |

### Distribution Routes *(Authentication required)*

| Method | Endpoint                          | Description                   |
|--------|-----------------------------------|-------------------------------|
| POST   | `/jobs/:id/distribute`            | Distribute job to all platforms |
| POST   | `/jobs/:id/distribute/linkedin`   | Post job to LinkedIn          |
| DELETE | `/jobs/:id/distribute/linkedin`   | Remove job from LinkedIn      |
| POST   | `/jobs/:id/distribute/indeed`     | Post job to Indeed            |
| DELETE | `/jobs/:id/distribute/indeed`     | Remove job from Indeed        |
| GET    | `/jobs/:id/distribute/status`     | Get distribution status       |

---

## Authentication & Roles

HireFlow uses **JWT-based authentication** with role-based access control.

| Role        | Permissions                              |
|-------------|------------------------------------------|
| `admin`     | Full access to all features              |
| `recruiter` | Create, edit, delete, and distribute jobs|
| `applicant` | View job listings only                   |

---

## Job Distribution

HireFlow supports distributing job postings to:

- **LinkedIn** – Post and remove jobs via LinkedIn API
- **Indeed** – Post/remove jobs & expose an XML feed for Indeed's crawler

---

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Indeed
INDEED_API_KEY=your_indeed_api_key
```

---

## 📄 License

This project is licensed under the **MIT License**.

---

> Built with ❤️ by the HireFlow Team