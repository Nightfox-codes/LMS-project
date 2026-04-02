import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import AuthPage from "./AuthPage"
import StudentDashboard from "./pages/StudentDashboard"
import InstructorDashboard from "./pages/InstructorDashboard"
import AdminDashboard from "./pages/AdminDashboard"
import AdminReports from "./pages/AdminReports"
import ScormPlayer from "./pages/ScormPlayer"
import useTrackActivity from "./hooks/useTrackActivity";

const globalStyle = document.createElement('style')
globalStyle.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; width: 100%; overflow: hidden; background: #0d1117; }
`
document.head.appendChild(globalStyle)

// This rigorously locks out users who try to guess the URL without logging in
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user_id = sessionStorage.getItem("user_id");
  const role = sessionStorage.getItem("role");

  if (!user_id || !role) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // If they try to access a page they aren't authorized for, force them back to their home dashboard
    if (role === "admin") return <Navigate to="/admin-dashboard" replace />;
    if (role === "instructor") return <Navigate to="/instructor-dashboard" replace />;
    return <Navigate to="/student-dashboard" replace />;
  }

  return children;
};

function App() {
    const user_id = sessionStorage.getItem("user_id")
    useTrackActivity(user_id)
        
   return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        
        <Route path="/student-dashboard" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/instructor-dashboard" element={
          <ProtectedRoute allowedRoles={["instructor"]}>
            <InstructorDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/admin-reports" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminReports />
          </ProtectedRoute>
        } />
        
        <Route path="/scorm-player/:course_id" element={<ScormPlayer />} />
        <Route path="/scorm-player/:course_id/:lesson_id" element={<ScormPlayer />} />
      </Routes>
    </Router>
  )
}

export default App
