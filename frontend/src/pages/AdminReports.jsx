import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:5000";

const Icon = ({ d, size = 18, stroke = "currentColor", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};

const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 28, height: 28, border: "3px solid rgba(91,110,245,0.2)", borderTop: "3px solid #5b6ef5", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
  </div>
);

const Badge = ({ status }) => {
  const map = {
    passed: { bg: "rgba(74,222,128,0.15)", color: "#4ade80", label: "Passed" },
    failed: { bg: "rgba(248,113,113,0.15)", color: "#f87171", label: "Failed" },
    incomplete: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", label: "Incomplete" },
  };
  const s = map[status] || { bg: "rgba(255,255,255,0.1)", color: "#aaa", label: status || "Unknown" };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
      {s.label}
    </span>
  );
};

export default function AdminReports() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("course");
  
  // By Course state
  const [coursesList, setCoursesList] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courseReport, setCourseReport] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(false);

  // By User state
  const [usersList, setUsersList] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [userReport, setUserReport] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);

  // Initial Fetch for dropdowns
  useEffect(() => {
    fetch(`${API}/api/reports/list-courses`).then(r => r.json()).then(setCoursesList).catch(console.error);
    fetch(`${API}/api/reports/list-users`).then(r => r.json()).then(setUsersList).catch(console.error);
  }, []);

  // Fetch Course Report
  useEffect(() => {
    if (!selectedCourse) { setCourseReport(null); return; }
    setLoadingCourse(true);
    fetch(`${API}/api/reports/courses/${selectedCourse}/users`)
      .then(r => r.json())
      .then(d => { setCourseReport(d.users); setLoadingCourse(false); })
      .catch(() => setLoadingCourse(false));
  }, [selectedCourse]);

  // Fetch User Report
  useEffect(() => {
    if (!selectedUser) { setUserReport(null); return; }
    setLoadingUser(true);
    fetch(`${API}/api/reports/users/${selectedUser}/courses`)
      .then(r => r.json())
      .then(d => { setUserReport(d.courses); setLoadingUser(false); })
      .catch(() => setLoadingUser(false));
  }, [selectedUser]);


  return (
    <div style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <div>
            <button onClick={() => navigate("/admin-dashboard")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#818cf8", cursor: "pointer", fontSize: 13, marginBottom: 14, padding: 0 }}>
              <Icon d={icons.arrowLeft} size={14} stroke="#818cf8" /> Back to Dashboard
            </button>
            <h1 style={{ margin: 0, fontSize: 32, fontFamily: "'Playfair Display', serif", color: "#fff", fontWeight: 600 }}>Progress Reports</h1>
            <div style={{ fontSize: 14, color: "#7a8aaa", marginTop: 4 }}>Track student engagement and SCORM completion rates.</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setActiveTab("course")}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 14, border: "none", transition: "all 0.2s",
              background: activeTab === "course" ? "#5b6ef5" : "rgba(255,255,255,0.05)",
              color: activeTab === "course" ? "#fff" : "#7a8aaa"
            }}>
            <Icon d={icons.book} size={16} /> By Course
          </button>
          <button onClick={() => setActiveTab("user")}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 14, border: "none", transition: "all 0.2s",
              background: activeTab === "user" ? "#5b6ef5" : "rgba(255,255,255,0.05)",
              color: activeTab === "user" ? "#fff" : "#7a8aaa"
            }}>
            <Icon d={icons.users} size={16} /> By User
          </button>
        </div>

        {/* ── COURSE TAB ── */}
        {activeTab === "course" && (
          <div style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "24px 28px" }}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, color: "#7a8aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Select a Course</label>
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                style={{ width: "100%", maxWidth: 400, background: "#0f1420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e0e8ff", padding: "12px 14px", fontSize: 15, cursor: "pointer", appearance: "none" }}>
                <option value="">-- Select a course to view progress --</option>
                {coursesList.map(c => <option key={c.course_id} value={c.course_id}>{c.title}</option>)}
              </select>
            </div>

            {loadingCourse ? <Spinner /> : courseReport && (
              <div>
                <div style={{ fontSize: 13, color: "#7a8aaa", marginBottom: 16 }}>Showing {courseReport.length} users enrolled/active</div>
                {courseReport.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#4a5568", background: "rgba(0,0,0,0.1)", borderRadius: 12 }}>No activity recorded for this course yet.</div>
                ) : (
                  <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, color: "#7a8aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>User Name</th>
                          <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, color: "#7a8aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</th>
                          <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, color: "#7a8aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Best Score</th>
                          <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, color: "#7a8aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Last Accessed</th>
                          <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, color: "#7a8aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseReport.map((u, i) => (
                          <tr key={u.user_id} style={{ borderBottom: i === courseReport.length - 1 ? "none" : "1px solid rgba(255,255,255,0.03)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                            <td style={{ padding: "16px 20px", color: "#e0e8ff", fontSize: 14, fontWeight: 500 }}>{u.name}</td>
                            <td style={{ padding: "16px 20px", color: "#a0aec0", fontSize: 13 }}>{u.email}</td>
                            <td style={{ padding: "16px 20px", color: "#e0e8ff", fontSize: 14 }}>{u.highest_score} <span style={{fontSize:11, color:"#7a8aaa"}}>%</span></td>
                            <td style={{ padding: "16px 20px", color: "#a0aec0", fontSize: 13 }}>{u.last_active || "Never"}</td>
                            <td style={{ padding: "16px 20px" }}><Badge status={u.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── USER TAB ── */}
        {activeTab === "user" && (
          <div style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "24px 28px" }}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, color: "#7a8aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Select a User</label>
              <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
                style={{ width: "100%", maxWidth: 400, background: "#0f1420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e0e8ff", padding: "12px 14px", fontSize: 15, cursor: "pointer", appearance: "none" }}>
                <option value="">-- Select a user to view progress --</option>
                {usersList.map(u => <option key={u.user_id} value={u.user_id}>{u.name} ({u.email})</option>)}
              </select>
            </div>

            {loadingUser ? <Spinner /> : userReport && (
              <div>
                <div style={{ fontSize: 13, color: "#7a8aaa", marginBottom: 16 }}>Showing {userReport.length} active courses</div>
                {userReport.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#4a5568", background: "rgba(0,0,0,0.1)", borderRadius: 12 }}>No activity recorded for this user yet.</div>
                ) : (
                  <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, color: "#7a8aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Course</th>
                          <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, color: "#7a8aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Category</th>
                          <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, color: "#7a8aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Best Score</th>
                          <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, color: "#7a8aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Last Accessed</th>
                          <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, color: "#7a8aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userReport.map((c, i) => (
                          <tr key={c.course_id} style={{ borderBottom: i === userReport.length - 1 ? "none" : "1px solid rgba(255,255,255,0.03)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                            <td style={{ padding: "16px 20px", color: "#e0e8ff", fontSize: 14, fontWeight: 500 }}>{c.title}</td>
                            <td style={{ padding: "16px 20px", color: "#a0aec0", fontSize: 13 }}>{c.category || "None"}</td>
                            <td style={{ padding: "16px 20px", color: "#e0e8ff", fontSize: 14 }}>{c.best_score} <span style={{fontSize:11, color:"#7a8aaa"}}>%</span></td>
                            <td style={{ padding: "16px 20px", color: "#a0aec0", fontSize: 13 }}>{c.last_accessed || "Never"}</td>
                            <td style={{ padding: "16px 20px" }}><Badge status={c.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
