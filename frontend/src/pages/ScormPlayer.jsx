import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const Icon = ({ d, size = 18, stroke = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const icons = {
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  check:     "M20 6L9 17l-5-5",
  clock:     "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  award:     "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12",
  refresh:   "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  history:   "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  x:         "M18 6L6 18M6 6l12 12",
  list:      "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
};

export default function ScormPlayer() {
  const { course_id, lesson_id } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const saveTimerRef = useRef(null);

  const [courseTitle, setCourseTitle] = useState("Loading...");
  const [status, setStatus]           = useState("incomplete");
  const [score, setScore]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [lastSaved, setLastSaved]     = useState(null);

  // ── Attempt state
  const [attemptNumber, setAttemptNumber]     = useState(null);
  const [maxAttempts, setMaxAttempts]         = useState(null);
  const [attempts, setAttempts]               = useState([]);
  const [showHistory, setShowHistory]         = useState(false);
  const [attemptLocked, setAttemptLocked]     = useState(false);

  // ── Timer state
  const [timeLimit, setTimeLimit] = useState(null);
  const [timeLeft, setTimeLeft]   = useState(null);
  const timerRef = useRef(null);

  // ── Refs for exit-time logging (refs avoid stale closure issues)
  const sessionStartRef = useRef(null);
  const attemptLoggedRef = useRef(false);
  const latestStatusRef = useRef("incomplete");
  const latestScoreRef = useRef(0);
  const latestSuspendDataRef = useRef("");
  const latestLessonLocationRef = useRef("");

  const user_id = sessionStorage.getItem("user_id") || "0";

  // ── Fetch attempt history
  const loadAttemptHistory = async () => {
    try {
      const lessonQuery = lesson_id ? `&lesson_id=${lesson_id}` : "";
      const res = await fetch(`${API}/api/scorm/${course_id}/attempts?user_id=${user_id}${lessonQuery}`);
      const data = await res.json();
      if (data.attempts) {
        setAttempts(data.attempts);
        setMaxAttempts(data.max_attempts);
        return data;
      }
      if (Array.isArray(data)) { setAttempts(data); return { attempts: data }; }
      return data;
    } catch (e) {
      console.error("Failed to load attempt history", e);
      return null;
    }
  };

  // ── Log the final attempt (INSERT-only)
  const logAttempt = async () => {
    if (attemptLoggedRef.current) return;
    attemptLoggedRef.current = true;

    const completionStatus = latestStatusRef.current || "incomplete";
    const rawScore = latestScoreRef.current || 0;
    const suspendData = latestSuspendDataRef.current || "";
    const lessonLocation = latestLessonLocationRef.current || "";

    try {
      const res = await fetch(`${API}/api/scorm/${course_id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: parseInt(user_id),
          lesson_id: lesson_id ? parseInt(lesson_id) : null,
          started_at: sessionStartRef.current,
          score: rawScore,
          completion_status: completionStatus,
          suspend_data: suspendData,
          lesson_location: lessonLocation,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAttemptNumber(data.attempt_number);
      }
    } catch (e) {
      console.error("Failed to log attempt", e);
      attemptLoggedRef.current = false;
    }
  };

  // ── Timer useEffect — MUST be at top level, NOT inside init()
  useEffect(() => {
    if (timeLeft === null || attemptLocked) return;
    if (timeLeft <= 0) {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: "force-commit" }, "*");
      }
      setTimeout(() => {
        logAttempt().then(() => {
          alert("⏰ Time limit reached! The session will now close.");
          goBack();
        });
      }, 500);
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, attemptLocked]);

  // ── On mount: fetch launch info, check if allowed, record session start
  useEffect(() => {
    const init = async () => {
      try {
        // Record session start time
        const now = new Date();
        const pad = (n, w = 2) => String(n).padStart(w, "0");
        sessionStartRef.current =
          `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
          `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        // Fetch course title
        const cRes = await fetch(`${API}/courses`);
        const courses = await cRes.json();
        const course = courses.find(c => String(c.course_id) === String(course_id));
        if (course) setCourseTitle(course.title);

        // Fetch existing progress (for resume)
        const lessonQuery = lesson_id ? `&lesson_id=${lesson_id}` : "";
        const pRes = await fetch(`${API}/api/scorm/${course_id}/progress?user_id=${user_id}${lessonQuery}`);
        const progress = await pRes.json();
        setStatus(progress.completion_status || "incomplete");
        if (progress.score) setScore(progress.score);

        // ── Fetch SCORM settings (time limit, force_new_attempt)
        const lessonQuery2 = lesson_id ? `?lesson_id=${lesson_id}` : "";
        const sRes = await fetch(`${API}/api/courses/${course_id}/scorm-settings${lessonQuery2}`);
        const settings = await sRes.json();
        if (settings.time_limit) {
          const seconds = settings.time_limit * 60; // mins → seconds
          setTimeLimit(seconds);
          setTimeLeft(seconds);
        }
        const forceNew = settings.force_new_attempt ? 1 : 0;

        // Load attempt history + check lockout
        const historyData = await loadAttemptHistory();
        if (historyData) {
          const totalDone = historyData.total_attempts || (historyData.attempts ? historyData.attempts.length : 0);
          const max = historyData.max_attempts;
          setMaxAttempts(max);
          setAttemptNumber(totalDone + 1);

          if (max !== null && max !== undefined && totalDone >= max) {
            setAttemptLocked(true);
            setLoading(false);
            return;
          }
        }

        // Load SCORM iframe (pass force_new_attempt so bridge skips resume)
        if (iframeRef.current) {
          if (lesson_id) {
            iframeRef.current.src = `${API}/lesson-scorm-play/${lesson_id}?user_id=${user_id}&force_new=${forceNew}`;
          } else {
            iframeRef.current.src = `${API}/scorm-play/${course_id}?user_id=${user_id}&force_new=${forceNew}`;
          }
        }

        setLoading(false);
      } catch (e) {
        console.error(e);
        setError("Failed to load SCORM package.");
        setLoading(false);
      }
    };

    init();

    // Listen for SCORM data from iframe postMessage
    const handleMessage = (event) => {
      if (event.data && event.data.type === "scorm-commit") {
        const d = event.data.data;
        if (d.completion_status) {
          setStatus(d.completion_status);
          latestStatusRef.current = d.completion_status;
        }
        if (d.score !== undefined) {
          setScore(d.score);
          latestScoreRef.current = d.score;
        }
        if (d.suspend_data !== undefined) {
          latestSuspendDataRef.current = d.suspend_data;
        }
        if (d.lesson_location !== undefined) {
          latestLessonLocationRef.current = d.lesson_location;
        }
        setLastSaved(new Date().toLocaleTimeString());

        if (["completed", "passed", "failed"].includes(d.completion_status) && !attemptLoggedRef.current) {
          logAttempt();
        }
      }
    };
    window.addEventListener("message", handleMessage);

    // Safety net: log attempt on tab close
    const handleBeforeUnload = () => {
      if (!attemptLoggedRef.current && sessionStartRef.current) {
        const payload = JSON.stringify({
          user_id: parseInt(user_id),
          lesson_id: lesson_id ? parseInt(lesson_id) : null,
          started_at: sessionStartRef.current,
          score: latestScoreRef.current || 0,
          completion_status: latestStatusRef.current || "incomplete",
          suspend_data: latestSuspendDataRef.current || "",
          lesson_location: latestLessonLocationRef.current || "",
        });
        navigator.sendBeacon(
          `${API}/api/scorm/${course_id}/attempts`,
          new Blob([payload], { type: "application/json" })
        );
        attemptLoggedRef.current = true;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearTimeout(timerRef.current);
    };
  }, [course_id]);

  // ── Navigate back — log attempt first
  const goBack = async () => {
    clearTimeout(timerRef.current);
    await logAttempt();
    const role = sessionStorage.getItem("role");
    if (role === "student") window.location.href = "/student-dashboard";
    else if (role === "instructor") window.location.href = "/instructor-dashboard";
    else window.location.href = "/admin-dashboard";
  };

  // ── Status badge styling
  const statusStyle = {
    completed: { bg: "rgba(74,222,128,0.15)",  color: "#4ade80",  label: "Completed" },
    passed:    { bg: "rgba(74,222,128,0.15)",  color: "#4ade80",  label: "Passed" },
    failed:    { bg: "rgba(248,113,113,0.15)", color: "#f87171",  label: "Failed" },
    incomplete:{ bg: "rgba(251,191,36,0.15)",  color: "#fbbf24",  label: "In Progress" },
  };
  const ss = statusStyle[status] || statusStyle.incomplete;

  // ── Format date helper
  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " +
           d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  // ── Duration helper
  const fmtDuration = (startIso, endIso) => {
    if (!startIso || !endIso) return "—";
    const ms = new Date(endIso) - new Date(startIso);
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // ── Format time left helper
  const fmtTimeLeft = (secs) => {
    if (secs === null) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ── Attempt status badge
  const attemptBadge = (s) => {
    const map = {
      completed: { bg: "rgba(74,222,128,0.12)", color: "#4ade80", label: "Completed" },
      passed:    { bg: "rgba(74,222,128,0.12)", color: "#4ade80", label: "Passed" },
      failed:    { bg: "rgba(248,113,113,0.12)", color: "#f87171", label: "Failed" },
      incomplete:{ bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", label: "In Progress" },
    };
    const m = map[s] || map.incomplete;
    return (
      <span style={{ background: m.bg, color: m.color, padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {m.label}
      </span>
    );
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; background: #0d1117; }
        .history-panel { animation: slideIn 0.25s ease-out; }
        .attempt-row:hover { background: rgba(255,255,255,0.03) !important; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0d1117", fontFamily: "'DM Sans', sans-serif", color: "#c8d4f0" }}>

        {/* ── Top bar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 24px", background: "#0f1420", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>

          {/* Back */}
          <button onClick={goBack}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#7a8aaa", borderRadius: 9, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>
            <Icon d={icons.arrowLeft} size={15} /> Exit
          </button>

          {/* Title */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", fontFamily: "'Playfair Display', serif" }}>{courseTitle}</div>
            <div style={{ fontSize: 11, color: "#4a5568", marginTop: 1 }}>
              SCORM Course Preview
              {attemptNumber && (
                <span style={{ marginLeft: 8, color: "#5b6ef5" }}>
                  • Attempt #{attemptNumber}{maxAttempts ? ` of ${maxAttempts}` : ""}
                </span>
              )}
            </div>
          </div>

          {/* Score */}
          {score !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(91,110,245,0.12)", border: "1px solid rgba(91,110,245,0.2)", borderRadius: 8, padding: "6px 12px" }}>
              <Icon d={icons.award} size={14} stroke="#818cf8" />
              <span style={{ fontSize: 13, color: "#818cf8", fontWeight: 600 }}>Score: {score}%</span>
            </div>
          )}

          {/* Status badge */}
          <span style={{ background: ss.bg, color: ss.color, padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {ss.label}
          </span>

          {/* Last saved */}
          {lastSaved && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#4a5568" }}>
              <Icon d={icons.clock} size={12} stroke="#4a5568" />
              Saved {lastSaved}
            </div>
          )}

          {/* ── Countdown Timer (hidden when locked out) ── */}
          {timeLeft !== null && !attemptLocked && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: timeLeft <= 60 ? "rgba(248,113,113,0.15)" : "rgba(251,191,36,0.1)",
              border: `1px solid ${timeLeft <= 60 ? "rgba(248,113,113,0.3)" : "rgba(251,191,36,0.2)"}`,
              borderRadius: 8, padding: "6px 12px",
              animation: timeLeft <= 30 ? "pulse 1s ease-in-out infinite" : "none",
            }}>
              <Icon d={icons.clock} size={14} stroke={timeLeft <= 60 ? "#f87171" : "#fbbf24"} />
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: timeLeft <= 60 ? "#f87171" : "#fbbf24",
                fontVariantNumeric: "tabular-nums",
              }}>
                {fmtTimeLeft(timeLeft)}
              </span>
              <span style={{ fontSize: 10, color: "#4a5568" }}>left</span>
            </div>
          )}

          {/* Attempt History toggle */}
          <button
            onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadAttemptHistory(); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: showHistory ? "rgba(91,110,245,0.15)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${showHistory ? "rgba(91,110,245,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: showHistory ? "#818cf8" : "#7a8aaa",
              borderRadius: 9, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500,
            }}
          >
            <Icon d={icons.list} size={14} />
            Attempts
          </button>
        </div>

        {/* ── Content area ── */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex" }}>

          {/* Loading state */}
          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#0d1117", zIndex: 10 }}>
              <div style={{ width: 40, height: 40, border: "3px solid rgba(91,110,245,0.2)", borderTop: "3px solid #5b6ef5", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <div style={{ fontSize: 14, color: "#4a5568" }}>Loading SCORM package...</div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#0d1117" }}>
              <div style={{ fontSize: 40 }}>📦</div>
              <div style={{ fontSize: 16, color: "#f87171", fontWeight: 600 }}>{error}</div>
              <button onClick={goBack}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#7a8aaa", borderRadius: 9, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>
                <Icon d={icons.arrowLeft} size={15} /> Exit
              </button>
            </div>
          )}

          {/* Attempt locked state */}
          {attemptLocked && !loading && !error && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, background: "#0d1117" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(248,113,113,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display', serif", marginBottom: 6 }}>
                  Maximum Attempts Reached
                </div>
                <div style={{ fontSize: 14, color: "#4a5568", lineHeight: 1.6 }}>
                  You've used all <strong style={{ color: "#818cf8" }}>{maxAttempts}</strong> allowed attempts for this course.
                  <br />Review your attempt history below.
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => { setShowHistory(true); loadAttemptHistory(); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(91,110,245,0.12)", border: "1px solid rgba(91,110,245,0.25)", color: "#818cf8", borderRadius: 9, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  <Icon d={icons.list} size={14} stroke="#818cf8" /> View History
                </button>
                <button onClick={goBack}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#7a8aaa", borderRadius: 9, padding: "10px 20px", cursor: "pointer", fontSize: 13 }}>
                  <Icon d={icons.arrowLeft} size={15} /> Go Back
                </button>
              </div>
            </div>
          )}

          {/* SCORM iframe */}
          {!error && !attemptLocked && (
            <iframe
              ref={iframeRef}
              title="SCORM Content"
              style={{
                flex: 1,
                width: "100%",
                height: "100%",
                border: "none",
                display: loading ? "none" : "block",
                background: "#fff",
              }}
              allow="fullscreen"
              onLoad={() => setLoading(false)}
            />
          )}

          {/* ── Attempt History Side Panel ── */}
          {showHistory && (
            <div className="history-panel" style={{
              width: 380, flexShrink: 0, background: "#0f1420",
              borderLeft: "1px solid rgba(255,255,255,0.06)",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Attempt History</div>
                  <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>
                    {attempts.length} attempt{attempts.length !== 1 ? "s" : ""}
                    {maxAttempts && ` • Max: ${maxAttempts}`}
                  </div>
                </div>
                <button onClick={() => setShowHistory(false)}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#7a8aaa" }}>
                  <Icon d={icons.x} size={14} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
                {attempts.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#4a5568" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                    <div style={{ fontSize: 13 }}>No attempts recorded yet</div>
                  </div>
                )}

                {attempts.map((att) => {
                  const isCurrent = att.attempt_number === attemptNumber;
                  return (
                    <div key={att.attempt_id} className="attempt-row" style={{
                      background: isCurrent ? "rgba(91,110,245,0.06)" : "transparent",
                      border: `1px solid ${isCurrent ? "rgba(91,110,245,0.15)" : "rgba(255,255,255,0.04)"}`,
                      borderRadius: 10, padding: "14px 16px", marginBottom: 8,
                      transition: "background 0.15s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 28, height: 28, borderRadius: "50%",
                            background: isCurrent ? "rgba(91,110,245,0.15)" : "rgba(255,255,255,0.06)",
                            fontSize: 12, fontWeight: 700,
                            color: isCurrent ? "#818cf8" : "#7a8aaa",
                          }}>
                            {att.attempt_number}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                            Attempt #{att.attempt_number}
                          </span>
                          {isCurrent && (
                            <span style={{ fontSize: 9, background: "rgba(91,110,245,0.15)", color: "#818cf8", padding: "2px 7px", borderRadius: 6, fontWeight: 600, textTransform: "uppercase" }}>
                              Current
                            </span>
                          )}
                        </div>
                        {attemptBadge(att.completion_status)}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 11, color: "#7a8aaa" }}>
                        <div>
                          <span style={{ color: "#4a5568" }}>Score: </span>
                          <span style={{ color: att.score > 0 ? "#818cf8" : "#7a8aaa", fontWeight: 600 }}>{att.score || 0}%</span>
                        </div>
                        <div>
                          <span style={{ color: "#4a5568" }}>Duration: </span>
                          <span>{fmtDuration(att.started_at, att.completed_at || att.last_accessed)}</span>
                        </div>
                        <div>
                          <span style={{ color: "#4a5568" }}>Started: </span>
                          <span>{fmtDate(att.started_at)}</span>
                        </div>
                        <div>
                          <span style={{ color: "#4a5568" }}>Ended: </span>
                          <span>{att.completed_at ? fmtDate(att.completed_at) : "—"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {attempts.length > 0 && (
                <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#4a5568" }}>
                    <div>
                      <span>Best Score: </span>
                      <span style={{ color: "#4ade80", fontWeight: 600 }}>
                        {Math.max(...attempts.map(a => a.score || 0))}%
                      </span>
                    </div>
                    <div>
                      <span>Completed: </span>
                      <span style={{ color: "#818cf8", fontWeight: 600 }}>
                        {attempts.filter(a => ["completed", "passed"].includes(a.completion_status)).length}/{attempts.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Bottom bar — completion banner ── */}
        {(status === "completed" || status === "passed") && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "12px 24px", background: "rgba(74,222,128,0.08)", borderTop: "1px solid rgba(74,222,128,0.2)", flexShrink: 0 }}>
            <Icon d={icons.check} size={16} stroke="#4ade80" />
            <span style={{ fontSize: 13, color: "#4ade80", fontWeight: 600 }}>
              Course {status === "passed" ? "passed" : "completed"}!
              {score !== null && ` Final score: ${score}%`}
              {attemptNumber && ` (Attempt #${attemptNumber})`}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
