# LearnSphere - Learning Management System (LMS)

LearnSphere is a modern, full-stack Learning Management System designed to seamlessly connect instructors and students. The platform allows for the creation, distribution, and tracking of educational content, including full support for SCORM compliant courses.

## 🚀 Features

- **Role-Based Access Control**: Different dashboards and permissions for Students, Instructors, and Administrators.
- **SCORM Support**: Fully supports uploading, extracting, and playing SCORM `.zip` packages natively using an embedded iframe player.
- **Course & Module Management**: Instructors and Admins can build courses, modules, and lessons. Supports various content types (Text, Video, PDF, Quiz, SCORM).
- **Progress Tracking**: Tracks student activity, attempts, scores, and calculates completion statuses.
- **Advanced Progress Reports**: Admin reporting per user and per course for engagement insights.
- **Micro-Animations & Modern UI**: Built with a highly responsive, modern glass-morphic UI with micro-interactions. 

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- React Router DOM
- Vanilla CSS (Glassmorphism, custom animations)
- Hosted on Vercel

**Backend:**
- Python & Flask
- PostgreSQL (via `psycopg2`)
- Gunicorn for production WSGI Deployment
- Cloud Hosting ready (Procfile included)

## 🏗️ Getting Started (Local Development)

### 1. Database Setup
1. Create a local PostgreSQL database named `lms_db`.
2. Ensure you have the `postgres` user set up, or configure the connection string in your environment.

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory (`/backend`).
2. Install the required Python dependencies:
   ```bash
   pip install flask flask-cors psycopg2 gunicorn
   ```
3. Run the Flask server locally:
   ```bash
   python server_2.py
   ```
   > The backend will bind to `0.0.0.0:8080`.

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory (`/frontend`).
2. Install the Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:5173` in your browser. The application will automatically detect your local network address and route API requests to your local backend on port `8080`.

## 📦 Deployment

**Frontend (Vercel):**
1. Connect your GitHub repository to Vercel.
2. Select the `/frontend` directory as your root.
3. Once deployed, the frontend will point to the production API url. 
*(Make sure to update the `API` fallback string in `src/AuthPage.jsx` and other files if your backend domain changes).*

**Backend (Railway / Render / Heroku):**
1. Connect your repository to your chosen PaaS provider.
2. The provided `Procfile` will automatically use `gunicorn` to launch `server_2:app` on the provided `$PORT`.
3. Configure the `DATABASE_URL` environment variable in your deployment settings to connect to your remote PostgreSQL database.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome. Feel free to check issues page if you want to contribute.
