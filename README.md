# Aura - Real Time Listening Platform

Aura. is a real-time collaborative music jam session platform. It allows users to create rooms, invite friends, and listen to music together in perfect sync. Alongside synchronized YouTube playback, users can chat in real-time, sharing texts and GIFs.

## Features

- **Real-time Synchronized Playback**: Listen to music together in sync across all connected clients.
- **Live Chat**: Built-in chat functionality with Giphy support for exchanging messages during sessions.
- **Room Management**: Create custom jam sessions and share links to invite friends.
- **Modern UI/UX**: Premium, responsive, dark-themed design built with Tailwind CSS and Framer Motion for smooth animations.
- **Authentication**: User authentication system built with Passport, supporting Google OAuth.

## Tech Stack

### Frontend
- **Framework**: React 19 (via Vite)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Real-time Engine**: WebSockets (Socket.io)
- **Media**: React YouTube, YT Music API , Giphy React Components

### Backend
- **Server**: Node.js, Express
- **Real-time Engine**: Socket.io with Redis Adapter for scalability
- **Database**: MongoDB (Mongoose) / PostgreSQL
- **Authentication**: Passport.js
- **Other**: YTMusic API integration

## Getting Started

Follow these instructions to run the project locally.

### Prerequisites
- Node.js installed on your machine
- Redis server running locally or accessible remotely
- MongoDB / PostgreSQL instances (as required by the `.env` configuration)

### 1. Clone the repository
```bash
git clone <repository-url>
cd practice
```

### 2. Backend Setup
Navigate into the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory and configure your environment variables (Database URIs, Redis URL, JWT Keys, Google OAuth variables, etc.).

Start the backend development server:
```bash
npm run start
```

### 3. Frontend Setup
Open a new terminal session, navigate into the frontend directory and install dependencies:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory for necessary frontend configurations if required.

Start the frontend development server:
```bash
npm run dev
```

### 4. Open Application
Navigate to `http://localhost:5173` in your browser to view the application.

## License
MIT License
