# 🎯 Smart Interview Preparation Platform

A full-stack MERN web application for practicing technical and behavioral interviews with AI-scored feedback, performance tracking, and admin management.

---

## ✨ Features

| Feature | Description |
|---|---|
| Auth | JWT-based register/login with bcrypt hashing |
| Mock Interviews | Category & difficulty filters, timed sessions |
| AI Scoring | Keyword-based answer scoring (0–10) with feedback |
| Resume Manager | Upload/manage PDF & DOC resumes with drag & drop |
| Dashboard | Recharts analytics — line, bar, pie charts |
| History | Paginated interview history with review mode |
| Profile | Edit bio, skills, target role; change password |
| Admin Panel | Manage users (ban/activate), manage questions (CRUD) |
| Responsive UI | Tailwind CSS dark theme, mobile-ready |

---

## 🛠 Tech Stack

**Backend:** Node.js · Express.js · MongoDB · Mongoose · JWT · bcryptjs · Multer  
**Frontend:** React 18 · Vite · Tailwind CSS · Context API · Recharts · React Router v6 · Axios

---

## 📁 Project Structure

```
Smart interview preparation platform/
├── backend/
│   ├── config/          # MongoDB connection
│   ├── controllers/     # authController, interviewController, questionController, resumeController, dashboardController, adminController
│   ├── middleware/       # auth.js (JWT protect), admin.js (role guard), upload.js (Multer)
│   ├── models/          # User, Interview, Question, Resume schemas
│   ├── routes/          # auth, interview, question, resume, dashboard, admin
│   ├── uploads/         # Uploaded resumes (gitignored)
│   ├── seed.js          # Database seed script (25 questions + demo accounts)
│   ├── server.js        # Express app entry point
│   └── .env             # Environment variables
└── frontend/
    ├── src/
    │   ├── components/  # Navbar, Toast, ProtectedRoute, AdminRoute, LoadingSpinner
    │   ├── context/     # AuthContext (global auth state)
    │   ├── pages/       # Home, Login, Register, Dashboard, Interviews, InterviewSession, InterviewHistory, Resume, Profile
    │   ├── pages/admin/ # AdminDashboard, ManageUsers, ManageQuestions
    │   ├── utils/       # api.js (Axios instance with interceptors)
    │   ├── App.jsx      # Routes
    │   └── main.jsx     # Entry point
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-interview-prep
JWT_SECRET=change_this_to_a_random_secret
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173
```

### 3. Seed the Database

```bash
cd backend
node seed.js
```

This creates:
- **25 interview questions** across 8 categories
- **Demo user:** `demo@example.com` / `demo123`
- **Admin user:** `admin@example.com` / `admin123`

### 4. Run the Application

```bash
# Terminal 1 — Backend
cd backend
npm run dev       # uses nodemon

# Terminal 2 — Frontend
cd frontend
npm run dev       # Vite dev server
```

Open **http://localhost:5173**

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Interviews
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/interviews/start` | Start a new session |
| PUT | `/api/interviews/:id/answer` | Submit an answer |
| PUT | `/api/interviews/:id/complete` | Complete interview |
| GET | `/api/interviews` | Get history (paginated) |
| GET | `/api/interviews/:id` | Get interview detail |
| DELETE | `/api/interviews/:id` | Delete interview |

### Questions (Admin only for write)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/questions` | List questions |
| POST | `/api/questions` | Create question (Admin) |
| PUT | `/api/questions/:id` | Update question (Admin) |
| DELETE | `/api/questions/:id` | Delete question (Admin) |

### Resumes
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/resumes/upload` | Upload resume file |
| GET | `/api/resumes` | List user's resumes |
| PUT | `/api/resumes/:id/default` | Set default resume |
| DELETE | `/api/resumes/:id` | Delete resume |

### Dashboard & Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Get user analytics |
| GET | `/api/admin/stats` | Platform stats |
| GET | `/api/admin/users` | All users |
| PUT | `/api/admin/users/:id/toggle` | Ban/activate user |
| GET | `/api/admin/questions` | All questions (admin view) |

---

## 🏗 Deployment

### Backend (Render / Railway)
1. Set environment variables on your host
2. Set start command: `node server.js`
3. Update `MONGODB_URI` to your Atlas connection string

### Frontend (Vercel / Netlify)
1. Build: `npm run build`
2. Set `VITE_API_URL` if not using Vite proxy
3. Update `vite.config.js` proxy target to your backend URL

---

## 🔐 Security Notes

- JWT tokens expire in 30 days (configurable)
- Passwords are hashed with bcrypt (salt rounds: 12)
- File uploads validated for type (PDF/DOC/DOCX) and size (5MB max)
- Admin routes protected by dual middleware (JWT + role check)
- All sensitive routes require `Authorization: Bearer <token>` header

---

## 📜 License

MIT © 2025 Smart Interview Prep Platform
