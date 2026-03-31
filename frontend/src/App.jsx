import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
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


function App() {
    
    const user_id = sessionStorage.getItem("user_id")
    useTrackActivity(user_id)
        
   return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-reports" element={<AdminReports />} />
        <Route path="/scorm-player/:course_id" element={<ScormPlayer />} />
        <Route path="/scorm-player/:course_id/:lesson_id" element={<ScormPlayer />} />
      </Routes>
    </Router>
  )
}

export default App
