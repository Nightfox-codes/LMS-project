import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:8080" : "https://lms-project-production-ba53.up.railway.app";

const Icon = ({ d, size = 18, stroke = "currentColor", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const icons = {
  grid:      "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z",
  book:      "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z",
  users:     "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  plus:      "M12 5v14M5 12h14",
  edit:      "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:     "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  x:         "M18 6L6 18M6 6l12 12",
  check:     "M20 6L9 17l-5-5",
  search:    "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  logout:    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  shield:    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  bell:      "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  refresh:   "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  chevD:     "M6 9l6 6 6-6",
  chevU:     "M18 15l-6-6-6 6",
  settings:  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  file:      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  video:     "M23 7l-7 5 7 5V7zM1 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
  type:      "M4 7V4h16v3M9 20h6M12 4v16",
  play:      "M5 3l14 9-14 9V3z",
  upload:    "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
};

// ── Shared UI ──────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    published: { bg: "rgba(74,222,128,0.15)",  color: "#4ade80", label: "Published" },
    draft:     { bg: "rgba(251,191,36,0.15)",   color: "#fbbf24", label: "Draft" },
    active:    { bg: "rgba(74,222,128,0.15)",   color: "#4ade80", label: "Active" },
    suspended: { bg: "rgba(248,113,113,0.15)",  color: "#f87171", label: "Suspended" },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
      {s.label}
    </span>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, width: 680, maxWidth: "95vw", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 26px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontFamily: "'Playfair Display', serif", color: "#fff" }}>{title}</h3>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#aaa", cursor: "pointer", borderRadius: 8, padding: "6px 8px", display: "flex" }}>
          <Icon d={icons.x} size={16} />
        </button>
      </div>
      <div style={{ overflowY: "auto", padding: "22px 26px", flex: 1 }}>{children}</div>
    </div>
  </div>
);

const Field = ({ label, value, onChange, type = "text", options }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 11, letterSpacing: "0.08em", color: "#7a8aaa", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
    {options ? (
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", background: "#0f1420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e0e8ff", padding: "10px 14px", fontSize: 14 }}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    ) : (
      <input type={type} value={value ?? ""} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", background: "#0f1420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e0e8ff", padding: "10px 14px", fontSize: 14, boxSizing: "border-box" }} />
    )}
  </div>
);

const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 28, height: 28, border: "3px solid rgba(91,110,245,0.2)", borderTop: "3px solid #5b6ef5", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
  </div>
);
const ScormSettingsPanel = ({ settings, onChange }) => {
  const s = settings;
  const toggle = (key) => onChange({ ...s, [key]: !s[key] });
  const set = (key, val) => onChange({ ...s, [key]: val });

  const Toggle = ({ label, desc, field }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div>
        <div style={{ fontSize: 13, color: "#c8d4f0", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>{desc}</div>
      </div>
      <div onClick={() => toggle(field)}
        style={{ width: 40, height: 22, borderRadius: 11, background: s[field] ? "#5b6ef5" : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 3, left: s[field] ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: 18, background: "rgba(91,110,245,0.05)", border: "1px solid rgba(91,110,245,0.15)", borderRadius: 12, padding: "16px 18px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(91,110,245,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚙️</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#818cf8", letterSpacing: "0.05em", textTransform: "uppercase" }}>SCORM Settings</div>
          <div style={{ fontSize: 11, color: "#4a5568" }}>Configure attempt rules and grading</div>
        </div>
      </div>

      {/* Row 1 — Max Attempts + Passing Score */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#7a8aaa", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Max Attempts</label>
          <input type="number" min="1" placeholder="Unlimited"
            value={s.max_attempts ?? ""}
            onChange={e => set("max_attempts", e.target.value === "" ? null : parseInt(e.target.value))}
            style={{ width: "100%", background: "#0f1420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e0e8ff", padding: "9px 12px", fontSize: 14, boxSizing: "border-box" }} />
          <div style={{ fontSize: 10, color: "#4a5568", marginTop: 4 }}>Leave blank for unlimited</div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#7a8aaa", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Passing Score (%)</label>
          <input type="number" min="0" max="100"
            value={s.passing_score ?? 40}
            onChange={e => set("passing_score", parseFloat(e.target.value))}
            style={{ width: "100%", background: "#0f1420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e0e8ff", padding: "9px 12px", fontSize: 14, boxSizing: "border-box" }} />
        </div>
      </div>

      {/* Row 2 — Grading Method + Time Limit */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#7a8aaa", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Grading Method</label>
          <select value={s.grading_method ?? "highest"}
            onChange={e => set("grading_method", e.target.value)}
            style={{ width: "100%", background: "#0f1420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e0e8ff", padding: "9px 12px", fontSize: 14 }}>
            <option value="highest">Highest Score</option>
            <option value="average">Average Score</option>
            <option value="first">First Attempt</option>
            <option value="last">Last Attempt</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#7a8aaa", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Time Limit (mins)</label>
          <input type="number" min="1" placeholder="No limit"
            value={s.time_limit ?? ""}
            onChange={e => set("time_limit", e.target.value === "" ? null : parseInt(e.target.value))}
            style={{ width: "100%", background: "#0f1420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e0e8ff", padding: "9px 12px", fontSize: 14, boxSizing: "border-box" }} />
          <div style={{ fontSize: 10, color: "#4a5568", marginTop: 4 }}>Leave blank for no limit</div>
        </div>
      </div>

      {/* Toggles */}
      <Toggle field="force_new_attempt" label="Force New Attempt"    desc="Always start fresh — ignore previous suspend data" />
      <Toggle field="lock_after_final"  label="Lock After Final Attempt" desc="Prevent access once max attempts are exhausted" />
    </div>
  );
};

const Btn = ({ onClick, color = "#5b6ef5", children, small, disabled, danger }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ display: "flex", alignItems: "center", gap: 6, background: danger ? "#f87171" : color, border: "none", color: "#fff", borderRadius: small ? 7 : 9, padding: small ? "5px 10px" : "10px 18px", cursor: disabled ? "not-allowed" : "pointer", fontSize: small ? 12 : 14, fontWeight: 600, opacity: disabled ? 0.6 : 1 }}>
    {children}
  </button>
);

// ── Course Manager ─────────────────────────────────────────────────────────
const CourseManager = ({ course, onBack }) => {
  const [modules,      setModules]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [expandedMod,  setExpandedMod]  = useState(null);
  const [expandedLes,  setExpandedLes]  = useState(null);
  const [lessons,      setLessons]      = useState({});
  const [materials,    setMaterials]    = useState({});
  const [modModal,     setModModal]     = useState(null);
  const [modForm,      setModForm]      = useState({});
  const [lesModal,     setLesModal]     = useState(null);
  const [lesForm,      setLesForm]      = useState({});
  const [matModal,     setMatModal]     = useState(null);
  const [matForm,      setMatForm]      = useState({});
  const [saving,       setSaving]       = useState(false);
  // SCORM lesson state
  const [scormFile,    setScormFile]    = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [scormResult,  setScormResult]  = useState(null); // { success, entry_point, lesson_id } | { error }
  const [lessonScormSettings, setLessonScormSettings] = useState({
    max_attempts: null, force_new_attempt: false, lock_after_final: false,
    grading_method: "highest", passing_score: 40, time_limit: null,
  });

  const user_id = sessionStorage.getItem("user_id") || "0";

  // ── Fetch modules on load
  useEffect(() => {
    fetch(`${API}/api/courses/${course.course_id}/modules`)
      .then(r => r.json())
      .then(d => { setModules(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [course.course_id]);

  // ── Lazy load lessons when module expanded
  const loadLessons = (mid) => {
    if (lessons[mid] !== undefined) return;
    fetch(`${API}/api/modules/${mid}/lessons`)
      .then(r => r.json())
      .then(d => setLessons(p => ({ ...p, [mid]: d })))
      .catch(() => setLessons(p => ({ ...p, [mid]: [] })));
  };

  // ── Lazy load materials when lesson expanded
  const loadMaterials = (lid) => {
    if (materials[lid] !== undefined) return;
    fetch(`${API}/api/lessons/${lid}/materials`)
      .then(r => r.json())
      .then(d => setMaterials(p => ({ ...p, [lid]: d })))
      .catch(() => setMaterials(p => ({ ...p, [lid]: [] })));
  };

  const toggleMod = (id) => { const n = expandedMod === id ? null : id; setExpandedMod(n); if (n) loadLessons(n); };
  const toggleLes = (id, contentType) => {
    if (contentType === "scorm") return; // SCORM lessons don't expand — they preview
    const n = expandedLes === id ? null : id;
    setExpandedLes(n);
    if (n) loadMaterials(n);
  };

  // ── Module CRUD
  const saveModule = async () => {
    setSaving(true);
    try {
      if (modModal.mode === "add") {
        const res = await fetch(`${API}/api/courses/${course.course_id}/modules`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(modForm)
        });
        const d = await res.json();
        if (res.ok) setModules(p => [...p, { ...modForm, module_id: d.id }]);
      } else {
        const res = await fetch(`${API}/api/modules/${modForm.module_id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(modForm)
        });
        if (res.ok) setModules(p => p.map(m => m.module_id === modForm.module_id ? modForm : m));
      }
    } catch (e) { console.error(e); }
    setSaving(false); setModModal(null);
  };

  const delModule = async (id) => {
    const res = await fetch(`${API}/api/modules/${id}`, { method: "DELETE" });
    if (res.ok) { setModules(p => p.filter(m => m.module_id !== id)); if (expandedMod === id) setExpandedMod(null); }
  };

  // ── Lesson CRUD (with SCORM support)
  const saveLesson = async () => {
    setSaving(true);
    try {
      if (lesModal.mode === "add") {
        // Step 1: Create the lesson
        const res = await fetch(`${API}/api/modules/${lesModal.mid}/lessons`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lesForm)
        });
        const d = await res.json();
        if (!res.ok) { setSaving(false); return; }
        const newLessonId = d.id;

        // Step 2: If SCORM type and file selected → upload zip
        if (lesForm.content_type === "scorm" && scormFile) {
          setUploading(true);
          const fd = new FormData();
          fd.append("file", scormFile);
          const upRes = await fetch(`${API}/api/lessons/${newLessonId}/upload-scorm`, {
            method: "POST", body: fd
          });
          const upData = await upRes.json();
          setUploading(false);

          if (!upRes.ok) {
            setLessons(p => ({ ...p, [lesModal.mid]: [...(p[lesModal.mid] || []), { ...lesForm, lesson_id: newLessonId, scorm_id: null }] }));
            setScormResult({ error: upData.error || "SCORM upload failed" });
            setSaving(false);
            return;
          }

          // Save SCORM settings for this course+lesson
          await fetch(`${API}/api/courses/${course.course_id}/scorm-settings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...lessonScormSettings, lesson_id: newLessonId }),
          });

          setLessons(p => ({ ...p, [lesModal.mid]: [...(p[lesModal.mid] || []), { ...lesForm, lesson_id: newLessonId, scorm_id: upData.scorm_id }] }));
          setScormResult({ success: true, entry_point: upData.entry_point, lesson_id: newLessonId });
          setSaving(false);
          return;
        }

        // Non-SCORM lesson
        setLessons(p => ({ ...p, [lesModal.mid]: [...(p[lesModal.mid] || []), { ...lesForm, lesson_id: newLessonId }] }));

      } else {
        // Edit lesson
        const res = await fetch(`${API}/api/lessons/${lesForm.lesson_id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lesForm)
        });
        if (res.ok) {
          setLessons(p => ({
            ...p, [lesModal.mid]: p[lesModal.mid].map(l => l.lesson_id === lesForm.lesson_id ? lesForm : l)
          }));
          // Save SCORM settings on edit too
          if (lesForm.content_type === "scorm") {
            await fetch(`${API}/api/courses/${course.course_id}/scorm-settings`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...lessonScormSettings, lesson_id: lesForm.lesson_id }),
            });
          }
        }
      }
    } catch (e) { console.error(e); }
    setSaving(false);
    setLesModal(null);
    setScormFile(null);
    setScormResult(null);
  };

  const delLesson = async (mid, lid) => {
    const res = await fetch(`${API}/api/lessons/${lid}`, { method: "DELETE" });
    if (res.ok) setLessons(p => ({ ...p, [mid]: p[mid].filter(l => l.lesson_id !== lid) }));
  };

  // ── Material CRUD
  const saveMaterial = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/lessons/${matModal.lid}/materials`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(matForm)
      });
      const d = await res.json();
      if (res.ok) setMaterials(p => ({ ...p, [matModal.lid]: [...(p[matModal.lid] || []), { ...matForm, material_id: d.id }] }));
    } catch (e) { console.error(e); }
    setSaving(false); setMatModal(null);
  };

  const delMaterial = async (lid, mid) => {
    const res = await fetch(`${API}/api/materials/${mid}`, { method: "DELETE" });
    if (res.ok) setMaterials(p => ({ ...p, [lid]: p[lid].filter(m => m.material_id !== mid) }));
  };

  const matIconD = (t) => t === "video" ? icons.video : t === "text" ? icons.type : icons.file;

  const contentTypeIcon = (t) => {
    if (t === "video")  return "🎬";
    if (t === "pdf")    return "📄";
    if (t === "quiz")   return "❓";
    if (t === "link")   return "🔗";
    if (t === "scorm")  return "📦";
    return "📝";
  };

  const openLessonModal = (mid, mode, les = null) => {
    setScormFile(null);
    setScormResult(null);
    setLessonScormSettings({
      max_attempts: null, force_new_attempt: false, lock_after_final: false,
      grading_method: "highest", passing_score: 40, time_limit: null,
    });
    if (mode === "add") {
      setLesForm({ title: "", content_type: "text" });
      setLesModal({ mode: "add", mid });
    } else {
      setLesForm({ ...les });
      setLesModal({ mode: "edit", mid });
      // Load existing SCORM settings when editing a SCORM lesson
      if (les && les.content_type === "scorm") {
        fetch(`${API}/api/courses/${course.course_id}/scorm-settings?lesson_id=${les.lesson_id}`)
          .then(r => r.json())
          .then(d => setLessonScormSettings(d))
          .catch(() => {});
      }
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>

      {/* ── Course Header ── */}
      <div style={{ marginBottom: 28 }}>
        <button onClick={onBack}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#818cf8", cursor: "pointer", fontSize: 13, marginBottom: 14, padding: 0 }}>
          <Icon d={icons.arrowLeft} size={14} stroke="#818cf8" /> Back to Courses
        </button>

        <div style={{ background: "linear-gradient(135deg, rgba(91,110,245,0.15), rgba(74,222,128,0.08))", border: "1px solid rgba(91,110,245,0.2)", borderRadius: 16, padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Course Manager</div>
            <h2 style={{ margin: 0, fontSize: 24, color: "#fff", fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>{course.title}</h2>
            {course.instructor && <div style={{ fontSize: 13, color: "#7a8aaa", marginTop: 4 }}>👨‍🏫 {course.instructor}</div>}
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#4ade80" }}>📚 {modules.length} Module{modules.length !== 1 ? "s" : ""}</div>
              <div style={{ fontSize: 12, color: "#818cf8" }}>📖 {Object.values(lessons).flat().length} Lesson{Object.values(lessons).flat().length !== 1 ? "s" : ""}</div>
            </div>
          </div>
          <Btn onClick={() => { setModForm({ title: "", description: "" }); setModModal({ mode: "add" }); }}>
            <Icon d={icons.plus} size={15} /> Add Module
          </Btn>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#7a8aaa" }}>
          {modules.length > 0 ? `${modules.length} section${modules.length !== 1 ? "s" : ""}` : ""}
        </div>
        {modules.length > 0 && (
          <button
            onClick={() => {
              if (expandedMod !== null) { setExpandedMod(null); }
              else { const firstId = modules[0]?.module_id; if (firstId) { setExpandedMod(firstId); loadLessons(firstId); } modules.forEach(m => loadLessons(m.module_id)); }
            }}
            style={{ background: "rgba(91,110,245,0.1)", border: "1px solid rgba(91,110,245,0.2)", color: "#818cf8", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
            {expandedMod !== null ? "⊖ Collapse All" : "⊕ Expand All"}
          </button>
        )}
      </div>

      {/* ── Module List ── */}
      {loading ? <Spinner /> : modules.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#1a1f2e", borderRadius: 16, border: "2px dashed rgba(91,110,245,0.2)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 16, color: "#e0e8ff", fontWeight: 600, marginBottom: 8 }}>No modules yet</div>
          <div style={{ fontSize: 13, color: "#4a5568", marginBottom: 20 }}>Start building this course by adding your first module</div>
          <Btn onClick={() => { setModForm({ title: "", description: "" }); setModModal({ mode: "add" }); }}>
            <Icon d={icons.plus} size={15} /> Add First Module
          </Btn>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {modules.map((mod, mi) => {
            const isOpen = expandedMod === mod.module_id;
            return (
              <div key={mod.module_id} style={{ background: "#1a1f2e", border: `1px solid ${isOpen ? "rgba(91,110,245,0.35)" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s" }}>

                {/* ── Module Header ── */}
                <div onClick={() => toggleMod(mod.module_id)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", cursor: "pointer", background: isOpen ? "rgba(91,110,245,0.07)" : "transparent", transition: "background 0.2s" }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "transparent"; }}>

                  <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${isOpen ? "#5b6ef5" : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s", background: isOpen ? "rgba(91,110,245,0.15)" : "transparent" }}>
                    <Icon d={isOpen ? icons.chevU : icons.chevD} size={14} stroke={isOpen ? "#818cf8" : "#7a8aaa"} />
                  </div>

                  <div style={{ background: isOpen ? "rgba(91,110,245,0.2)" : "rgba(255,255,255,0.06)", color: isOpen ? "#818cf8" : "#7a8aaa", borderRadius: 7, padding: "4px 10px", fontSize: 11, fontWeight: 700, flexShrink: 0, letterSpacing: "0.05em" }}>
                    SECTION {mi + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, color: "#e0e8ff", fontWeight: 600 }}>{mod.title}</div>
                    {mod.description && <div style={{ fontSize: 12, color: "#4a5568", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mod.description}</div>}
                  </div>

                  {lessons[mod.module_id] !== undefined && (
                    <div style={{ fontSize: 11, color: "#4a5568", background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: "3px 10px", flexShrink: 0 }}>
                      {lessons[mod.module_id].length} lesson{lessons[mod.module_id].length !== 1 ? "s" : ""}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setModForm({ ...mod }); setModModal({ mode: "edit" }); }}
                      style={{ background: "rgba(91,110,245,0.12)", border: "1px solid rgba(91,110,245,0.2)", color: "#818cf8", cursor: "pointer", borderRadius: 8, padding: "6px 8px", display: "flex" }}>
                      <Icon d={icons.edit} size={13} />
                    </button>
                    <button onClick={() => delModule(mod.module_id)}
                      style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)", color: "#f87171", cursor: "pointer", borderRadius: 8, padding: "6px 8px", display: "flex" }}>
                      <Icon d={icons.trash} size={13} />
                    </button>
                  </div>
                </div>

                {/* ── Lessons Panel ── */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid rgba(91,110,245,0.15)", background: "rgba(0,0,0,0.15)" }}>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ fontSize: 11, color: "#7a8aaa", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>📖 Lessons</div>
                      <Btn small onClick={() => openLessonModal(mod.module_id, "add")}>
                        <Icon d={icons.plus} size={12} /> Add Lesson
                      </Btn>
                    </div>

                    <div style={{ padding: "8px 16px 12px" }}>
                      {lessons[mod.module_id] === undefined ? <Spinner />
                        : lessons[mod.module_id].length === 0
                          ? <div style={{ textAlign: "center", padding: "20px 0", color: "#4a5568", fontSize: 13 }}>No lessons yet — click <strong style={{ color: "#818cf8" }}>Add Lesson</strong> to start</div>
                          : lessons[mod.module_id].map((les, li) => {
                            const lesOpen = expandedLes === les.lesson_id;
                            const isScorm = les.content_type === "scorm";
                            return (
                              <div key={les.lesson_id} style={{ background: lesOpen ? "rgba(91,110,245,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${lesOpen ? "rgba(91,110,245,0.2)" : "rgba(255,255,255,0.05)"}`, borderRadius: 10, marginBottom: 6, overflow: "hidden", transition: "all 0.2s" }}>

                                {/* Lesson row */}
                                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: isScorm ? "default" : "pointer" }}
                                  onClick={() => !isScorm && toggleLes(les.lesson_id, les.content_type)}>

                                  <div style={{ width: 32, height: 32, borderRadius: 8, background: isScorm ? "rgba(167,139,250,0.1)" : "rgba(74,222,128,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                                    {contentTypeIcon(les.content_type)}
                                  </div>

                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <span style={{ fontSize: 10, color: "#4a5568", fontWeight: 700 }}>{li + 1}.</span>
                                      <span style={{ fontSize: 14, color: "#c8d4f0", fontWeight: 500 }}>{les.title}</span>
                                    </div>
                                    <div style={{ fontSize: 11, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em", color: isScorm ? "#a78bfa" : "#4a5568" }}>{les.content_type}</div>
                                  </div>

                                  {/* SCORM preview button */}
                                  {isScorm && les.scorm_id && (
                                    <button
                                      onClick={e => { e.stopPropagation(); window.open(`${API}/lesson-scorm-play/${les.lesson_id}?user_id=${user_id}`, "_blank"); }}
                                      style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa", cursor: "pointer", borderRadius: 7, padding: "5px 10px", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                                      <Icon d={icons.play} size={12} stroke="#a78bfa" fill="#a78bfa" /> Preview
                                    </button>
                                  )}

                                  {/* SCORM not uploaded yet warning */}
                                  {isScorm && !les.scorm_id && (
                                    <span style={{ fontSize: 11, color: "#f59e0b", background: "rgba(245,158,11,0.1)", borderRadius: 20, padding: "3px 10px", flexShrink: 0 }}>
                                      ⚠ No file uploaded
                                    </span>
                                  )}

                                  {/* Material count for non-SCORM */}
                                  {!isScorm && materials[les.lesson_id] !== undefined && (
                                    <div style={{ fontSize: 11, color: "#4a5568", background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: "2px 8px", flexShrink: 0 }}>
                                      {materials[les.lesson_id].length} file{materials[les.lesson_id].length !== 1 ? "s" : ""}
                                    </div>
                                  )}

                                  <div style={{ display: "flex", gap: 5 }} onClick={e => e.stopPropagation()}>
                                    <button onClick={() => openLessonModal(mod.module_id, "edit", les)}
                                      style={{ background: "rgba(91,110,245,0.1)", border: "none", color: "#818cf8", cursor: "pointer", borderRadius: 6, padding: "4px 6px", display: "flex" }}>
                                      <Icon d={icons.edit} size={12} />
                                    </button>
                                    <button onClick={() => delLesson(mod.module_id, les.lesson_id)}
                                      style={{ background: "rgba(248,113,113,0.08)", border: "none", color: "#f87171", cursor: "pointer", borderRadius: 6, padding: "4px 6px", display: "flex" }}>
                                      <Icon d={icons.trash} size={12} />
                                    </button>
                                  </div>

                                  {!isScorm && <Icon d={lesOpen ? icons.chevU : icons.chevD} size={13} stroke="#4a5568" />}
                                </div>

                                {/* ── Materials Panel (non-SCORM only) ── */}
                                {!isScorm && lesOpen && (
                                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.1)", padding: "10px 14px 12px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                      <div style={{ fontSize: 10, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>📎 Materials</div>
                                      <Btn small onClick={() => { setMatForm({ title: "", type: "pdf", url: "" }); setMatModal({ lid: les.lesson_id }); }}>
                                        <Icon d={icons.plus} size={12} /> Add Material
                                      </Btn>
                                    </div>
                                    {materials[les.lesson_id] === undefined ? <Spinner />
                                      : materials[les.lesson_id].length === 0
                                        ? <div style={{ fontSize: 12, color: "#4a5568", padding: "4px 0" }}>No materials attached yet.</div>
                                        : materials[les.lesson_id].map(mat => (
                                          <div key={mat.material_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, marginBottom: 6 }}>
                                            <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(129,140,248,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                                              {mat.type === "video" ? "🎬" : mat.type === "pdf" ? "📄" : mat.type === "link" ? "🔗" : "📝"}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                              <div style={{ fontSize: 13, color: "#c8d4f0", fontWeight: 500 }}>{mat.title}</div>
                                              {mat.url && <div style={{ fontSize: 11, color: "#4a5568", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mat.url}</div>}
                                            </div>
                                            <span style={{ fontSize: 10, color: "#818cf8", background: "rgba(91,110,245,0.1)", borderRadius: 20, padding: "2px 8px", textTransform: "uppercase", fontWeight: 600, flexShrink: 0 }}>{mat.type}</span>
                                            <button onClick={() => delMaterial(les.lesson_id, mat.material_id)}
                                              style={{ background: "rgba(248,113,113,0.08)", border: "none", color: "#f87171", cursor: "pointer", borderRadius: 6, padding: "4px 6px", display: "flex", flexShrink: 0 }}>
                                              <Icon d={icons.trash} size={12} />
                                            </button>
                                          </div>
                                        ))
                                    }
                                  </div>
                                )}
                              </div>
                            );
                          })
                      }
                    </div>

                    {/* Add lesson footer shortcut */}
                    <div style={{ padding: "8px 20px 14px" }}>
                      <button onClick={() => openLessonModal(mod.module_id, "add")}
                        style={{ width: "100%", padding: "10px", background: "rgba(91,110,245,0.05)", border: "1px dashed rgba(91,110,245,0.2)", borderRadius: 10, color: "#818cf8", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <Icon d={icons.plus} size={14} stroke="#818cf8" /> Add lesson to this section
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Module footer shortcut ── */}
      {!loading && modules.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => { setModForm({ title: "", description: "" }); setModModal({ mode: "add" }); }}
            style={{ width: "100%", padding: "13px", background: "rgba(91,110,245,0.04)", border: "2px dashed rgba(91,110,245,0.15)", borderRadius: 14, color: "#818cf8", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon d={icons.plus} size={16} stroke="#818cf8" /> Add new section
          </button>
        </div>
      )}

      {/* ── Module Modal ── */}
      {modModal && (
        <Modal title={modModal.mode === "add" ? "Add Module" : "Edit Module"} onClose={() => setModModal(null)}>
          <Field label="Module Title" value={modForm.title} onChange={v => setModForm(p => ({ ...p, title: v }))} />
          <Field label="Description (optional)" value={modForm.description} onChange={v => setModForm(p => ({ ...p, description: v }))} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setModModal(null)} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#7a8aaa", borderRadius: 9, padding: "10px 20px", cursor: "pointer", fontSize: 14 }}>Cancel</button>
            <Btn onClick={saveModule} disabled={saving}>{saving ? "Saving..." : modModal.mode === "add" ? "Add Module" : "Save Changes"}</Btn>
          </div>
        </Modal>
      )}

      {/* ── Lesson Modal (with SCORM support) ── */}
      {lesModal && (
        <Modal title={lesModal.mode === "add" ? "Add Lesson" : "Edit Lesson"} onClose={() => { setLesModal(null); setScormFile(null); setScormResult(null); }}>

          {/* SCORM upload success screen */}
          {scormResult?.success ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
              <div style={{ fontSize: 17, color: "#4ade80", fontWeight: 600, marginBottom: 6 }}>SCORM Lesson Created!</div>
              <div style={{ fontSize: 12, color: "#7a8aaa", marginBottom: 4 }}>Entry point:</div>
              <div style={{ fontSize: 11, color: "#818cf8", background: "rgba(91,110,245,0.1)", borderRadius: 8, padding: "8px 14px", marginBottom: 20, wordBreak: "break-all" }}>{scormResult.entry_point}</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={() => { setLesModal(null); setScormFile(null); setScormResult(null); }}
                  style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#7a8aaa", borderRadius: 9, padding: "10px 20px", cursor: "pointer", fontSize: 14 }}>Close</button>
                <Btn onClick={() => window.open(`${API}/lesson-scorm-play/${scormResult.lesson_id}?user_id=${user_id}`, "_blank")}>
                  <Icon d={icons.play} size={14} fill="#fff" stroke="#fff" /> Preview Now
                </Btn>
              </div>
            </div>
          ) : (
            <>
              <Field label="Lesson Title" value={lesForm.title} onChange={v => setLesForm(p => ({ ...p, title: v }))} />

              {/* Content Type — custom toggle for SCORM */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 11, letterSpacing: "0.08em", color: "#7a8aaa", textTransform: "uppercase", marginBottom: 8 }}>Content Type</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { value: "text",  icon: "📝", label: "Text" },
                    { value: "video", icon: "🎬", label: "Video" },
                    { value: "pdf",   icon: "📄", label: "PDF" },
                    { value: "quiz",  icon: "❓", label: "Quiz" },
                    { value: "scorm", icon: "📦", label: "SCORM" },
                  ].map(opt => (
                    <div key={opt.value}
                      onClick={() => lesModal.mode === "add" && setLesForm(p => ({ ...p, content_type: opt.value }))}
                      style={{ flex: 1, minWidth: 70, padding: "10px 8px", borderRadius: 10, textAlign: "center", cursor: lesModal.mode === "add" ? "pointer" : "default", transition: "all 0.2s",
                        border: lesForm.content_type === opt.value ? "1px solid #5b6ef5" : "1px solid rgba(255,255,255,0.08)",
                        background: lesForm.content_type === opt.value ? "rgba(91,110,245,0.12)" : "rgba(255,255,255,0.02)" }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: lesForm.content_type === opt.value ? "#818cf8" : "#7a8aaa" }}>{opt.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SCORM file upload — only when scorm selected and adding */}
              {lesForm.content_type === "scorm" && lesModal.mode === "add" && (
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: 11, letterSpacing: "0.08em", color: "#7a8aaa", textTransform: "uppercase", marginBottom: 8 }}>SCORM Package (.zip)</label>
                  <div onClick={() => document.getElementById("lesson-scorm-zip").click()}
                    style={{ border: `2px dashed ${scormFile ? "#5b6ef5" : "rgba(255,255,255,0.12)"}`, borderRadius: 10, padding: "18px 16px", textAlign: "center", cursor: "pointer", background: scormFile ? "rgba(91,110,245,0.06)" : "rgba(255,255,255,0.02)" }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && f.name.endsWith(".zip")) setScormFile(f); }}>
                    <input id="lesson-scorm-zip" type="file" accept=".zip" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) setScormFile(e.target.files[0]); }} />
                    {scormFile ? (
                      <>
                        <div style={{ fontSize: 26, marginBottom: 5 }}>📦</div>
                        <div style={{ fontSize: 13, color: "#818cf8", fontWeight: 600 }}>{scormFile.name}</div>
                        <div style={{ fontSize: 11, color: "#4a5568", marginTop: 3 }}>{(scormFile.size / 1024 / 1024).toFixed(2)} MB — click to change</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 26, marginBottom: 5 }}>📁</div>
                        <div style={{ fontSize: 13, color: "#7a8aaa" }}>Click or drag & drop SCORM .zip</div>
                        <div style={{ fontSize: 11, color: "#4a5568", marginTop: 3 }}>Must contain imsmanifest.xml</div>
                      </>
                    )}
                  </div>

                  {scormResult?.error && (
                    <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, fontSize: 12, color: "#f87171" }}>
                      ⚠ {scormResult.error}
                    </div>
                  )}
                  {uploading && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#818cf8" }}>
                      <div style={{ width: 14, height: 14, border: "2px solid rgba(91,110,245,0.2)", borderTop: "2px solid #5b6ef5", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      Extracting and parsing imsmanifest.xml...
                    </div>
                  )}
                </div>
              )}

              {/* SCORM Settings — shown when scorm type is selected */}
              {lesForm.content_type === "scorm" && (
                <ScormSettingsPanel settings={lessonScormSettings} onChange={setLessonScormSettings} />
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => { setLesModal(null); setScormFile(null); setScormResult(null); }}
                  style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#7a8aaa", borderRadius: 9, padding: "10px 20px", cursor: "pointer", fontSize: 14 }}>Cancel</button>
                <Btn onClick={saveLesson} disabled={saving || uploading}>
                  {uploading ? "Uploading SCORM..." : saving ? "Saving..." : lesModal.mode === "add" ? "Add Lesson" : "Save Changes"}
                </Btn>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* ── Material Modal ── */}
      {matModal && (
        <Modal title="Add Material" onClose={() => setMatModal(null)}>
          <Field label="Title" value={matForm.title} onChange={v => setMatForm(p => ({ ...p, title: v }))} />
          <Field label="Type" value={matForm.type} onChange={v => setMatForm(p => ({ ...p, type: v }))} options={["pdf", "text", "video", "link"]} />
          <Field label="URL / Path (optional)" value={matForm.url} onChange={v => setMatForm(p => ({ ...p, url: v }))} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setMatModal(null)} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#7a8aaa", borderRadius: 9, padding: "10px 20px", cursor: "pointer", fontSize: 14 }}>Cancel</button>
            <Btn onClick={saveMaterial} disabled={saving}>{saving ? "Saving..." : "Add Material"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── Overview Tab ───────────────────────────────────────────────────────────
const OverviewTab = () => {
  const [stats,       setStats]       = useState(null);
  const [courses,     setCourses]     = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = async () => {
    try {
      const [sRes, cRes, iRes] = await Promise.all([
        fetch(`${API}/api/stats`),
        fetch(`${API}/courses`),
        fetch(`${API}/api/instructors-overview`),
      ]);
      const [sData, cData, iData] = await Promise.all([sRes.json(), cRes.json(), iRes.json()]);
      setStats(sData); setCourses(cData); setInstructors(iData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 30000); return () => clearInterval(t); }, []);

  const statCards = stats ? [
    { label: "Total Students", value: Number(stats.students?.total || 0).toLocaleString(), sub: `${stats.students?.active || 0} active this week`, color: "#5b6ef5" },
    { label: "Active Courses", value: stats.courses?.published || 0, sub: `${stats.courses?.total || 0} total`, color: "#4ade80" },
    { label: "Instructors",    value: stats.instructors?.total || 0, sub: `${stats.instructors?.pending || 0} pending`, color: "#f59e0b" },
  ] : [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginBottom: 14 }}>
        {lastUpdated && <span style={{ fontSize: 12, color: "#4a5568" }}>Updated: {lastUpdated}</span>}
        <button onClick={fetchAll} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(91,110,245,0.1)", border: "1px solid rgba(91,110,245,0.2)", color: "#818cf8", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>
          <Icon d={icons.refresh} size={13} stroke="#818cf8" /> Refresh
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {loading
          ? [1,2,3].map(i => <div key={i} style={{ background: "#1a1f2e", borderRadius: 14, height: 110, opacity: 0.4 }} />)
          : statCards.map(s => (
            <div key={s.label}
              style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "22px 24px", position: "relative", overflow: "hidden", transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = s.color + "55"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: s.color }} />
              <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#7a8aaa", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: s.color }}>{s.sub}</div>
            </div>
          ))
        }
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 22 }}>
          <h4 style={{ margin: "0 0 16px", fontSize: 12, color: "#7a8aaa", textTransform: "uppercase", letterSpacing: "0.08em" }}>Courses Overview</h4>
          {loading ? <Spinner /> : courses.length === 0
            ? <p style={{ color: "#4a5568", fontSize: 13 }}>No courses yet.</p>
            : courses.slice(0, 6).map((c, i) => (
              <div key={c.course_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < Math.min(courses.length, 6) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <span style={{ fontSize: 11, color: "#4a5568", width: 18, flexShrink: 0 }}>#{i+1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#c8d4f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: "#4a5568" }}>{c.instructor}</div>
                </div>
                <Badge status={c.status} />
              </div>
            ))
          }
        </div>
        <div style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 22 }}>
          <h4 style={{ margin: "0 0 16px", fontSize: 12, color: "#7a8aaa", textTransform: "uppercase", letterSpacing: "0.08em" }}>Instructors</h4>
          {loading ? <Spinner /> : instructors.length === 0
            ? <p style={{ color: "#4a5568", fontSize: 13 }}>No instructors found.</p>
            : instructors.map((inst, i) => (
              <div key={inst.id} style={{ padding: "10px 0", borderBottom: i < instructors.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: `hsl(${(inst.id||1)*73},55%,35%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700, flexShrink: 0 }}>
                    {`${(inst.firstname||"")[0]||""}${(inst.lastname||"")[0]||""}`.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#e0e8ff", fontWeight: 500 }}>{inst.firstname} {inst.lastname}</div>
                    <div style={{ fontSize: 11, color: "#4a5568" }}>{inst.email}</div>
                  </div>
                </div>
                {inst.courses?.length > 0 && (
                  <div style={{ paddingLeft: 40 }}>
                    {inst.courses.map(c => (
                      <div key={c.course_id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#5b6ef5", flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "#7a8aaa", flex: 1 }}>{c.title}</span>
                        <Badge status={c.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

// ── Courses Tab ────────────────────────────────────────────────────────────
const CoursesTab = () => {
  const [courses,      setCourses]     = useState([]);
  const [instructors,  setInstructors] = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [search,       setSearch]      = useState("");
  const [modal,        setModal]       = useState(null);
  const [form,         setForm]        = useState({});
  const [deleteId,     setDeleteId]    = useState(null);
  const [saving,       setSaving]      = useState(false);
  const [manageCourse, setManageCourse] = useState(null);
  const [scormFile,    setScormFile]   = useState(null);
  const [uploading,    setUploading]   = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [scormSettings, setScormSettings] = useState({
        max_attempts: null,
        force_new_attempt: false,
        lock_after_final: false,
        grading_method: "highest",
        passing_score: 40,
        time_limit: null,
       });
  useEffect(() => {
    Promise.all([
      fetch(`${API}/courses`).then(r => r.json()),
      fetch(`${API}/api/instructors-overview`).then(r => r.json()),
    ]).then(([cData, iData]) => { setCourses(cData); setInstructors(iData); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (manageCourse) return <CourseManager course={manageCourse} onBack={() => setManageCourse(null)} />;

  const filtered = courses.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.instructor?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
  setForm({ title: "", description: "", instructor_id: "", category: "Programming", status: "draft", course_type: "manual" });
  setScormFile(null); 
  setUploadResult(null);
  setScormSettings({ 
    max_attempts: null, 
    force_new_attempt: false, 
    lock_after_final: false, 
    grading_method: "highest", 
    passing_score: 40, 
    time_limit: null 
  });
  setModal({ mode: "add" });
};

  const openEdit = (c) => {
    setForm({ ...c });
    setScormFile(null); setUploadResult(null);
    setScormSettings({ max_attempts: null, force_new_attempt: false, lock_after_final: false, grading_method: "highest", passing_score: 40, time_limit: null });
    if (c.course_type === "scorm") {
    fetch(`${API}/api/courses/${c.course_id}/scorm-settings`)
      .then(r => r.json())
      .then(d => setScormSettings(d))
      .catch(() => {});
  }
    setModal({ mode: "edit" });
  };

  const save = async () => {
    setSaving(true);
    try {
      let courseId = form.course_id;

      if (modal.mode === "add") {
        const res = await fetch(`${API}/add-course`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
        });
        const d = await res.json();
        if (!res.ok) { setSaving(false); return; }
        courseId = d.id;
        setCourses(p => [...p, { ...form, course_id: courseId }]);
      } else {
        const res = await fetch(`${API}/update-course/${form.course_id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
        });
        if (res.ok) setCourses(p => p.map(c => c.course_id === form.course_id ? { ...form } : c));
        if (res.ok) {setCourses(p => p.map(c => c.course_id === form.course_id ? { ...form } : c));
        if (form.course_type === "scorm") {
          await fetch(`${API}/api/courses/${form.course_id}/scorm-settings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(scormSettings)
          });
        }
}
      }

      if (form.course_type === "scorm" && scormFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", scormFile);
        const upRes = await fetch(`${API}/api/courses/${courseId}/upload-scorm`, { method: "POST", body: fd });
        const upData = await upRes.json();
        setUploading(false);

        if (!upRes.ok) {
          setUploadResult({ error: upData.error || "Upload failed" });
          setSaving(false);
          return;
        }

        setUploadResult({ success: true, entry_point: upData.entry_point, courseId });
        setCourses(p => p.map(c => c.course_id === courseId ? { ...c, course_type: "scorm" } : c));
        setSaving(false);
        setUploadResult({ success: true, entry_point: upData.entry_point, courseId });
        setCourses(p => p.map(c => c.course_id === courseId ? { ...c, course_type: "scorm" } : c));

        // Save SCORM settings
        await fetch(`${API}/api/courses/${courseId}/scorm-settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scormSettings)
        });

        setSaving(false);
        return;
      }

    } catch (e) { console.error(e); }
    setSaving(false);
    setModal(null);
  };

  const del = async (id) => {
    const res = await fetch(`${API}/delete-course/${id}`, { method: "DELETE" });
    if (res.ok) setCourses(p => p.filter(c => c.course_id !== id));
    setDeleteId(null);
  };

  const instOptions = [{ value: "", label: "Select instructor..." }, ...instructors.map(i => ({ value: i.id, label: `${i.firstname} ${i.lastname}` }))];

  const TypeBadge = ({ type }) => (
    <span style={{ background: type === "scorm" ? "rgba(167,139,250,0.15)" : "rgba(91,110,245,0.12)", color: type === "scorm" ? "#a78bfa" : "#818cf8", padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {type === "scorm" ? " SCORM" : " Manual"}
    </span>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4a5568" }}><Icon d={icons.search} size={16} /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses or instructors..."
            style={{ width: "100%", background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#c8d4f0", padding: "10px 14px 10px 38px", fontSize: 14, boxSizing: "border-box" }} />
        </div>
        <Btn onClick={openAdd}><Icon d={icons.plus} size={16} /> Add Course</Btn>
      </div>

      <div style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
        {loading ? <Spinner /> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Course", "Instructor", "Category", "Type", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#4a5568", fontSize: 14 }}>No courses found</td></tr>
                : filtered.map((c, i) => (
                  <tr key={c.course_id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(91,110,245,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "14px 16px", fontSize: 14, color: "#e0e8ff", fontWeight: 500 }}>{c.title}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#7a8aaa" }}>{c.instructor}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#7a8aaa" }}>{c.category}</td>
                    <td style={{ padding: "14px 16px" }}><TypeBadge type={c.course_type || "manual"} /></td>
                    <td style={{ padding: "14px 16px" }}><Badge status={c.status} /></td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {c.course_type === "scorm" ? (
                          <button onClick={() => window.location.href = `/scorm-player/${c.course_id}`}
                            style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(167,139,250,0.12)", border: "none", color: "#a78bfa", cursor: "pointer", borderRadius: 7, padding: "6px 10px", fontSize: 12, fontWeight: 600 }}>
                            <Icon d={icons.play} size={12} stroke="#a78bfa" fill="#a78bfa" /> Preview
                          </button>
                        ) : (
                          <button onClick={() => setManageCourse(c)}
                            style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(74,222,128,0.1)", border: "none", color: "#4ade80", cursor: "pointer", borderRadius: 7, padding: "6px 10px", fontSize: 12, fontWeight: 600 }}>
                            <Icon d={icons.settings} size={13} stroke="#4ade80" /> Manage
                          </button>
                        )}
                        <button onClick={() => openEdit(c)} style={{ background: "rgba(91,110,245,0.15)", border: "none", color: "#5b6ef5", cursor: "pointer", borderRadius: 7, padding: "6px 8px", display: "flex" }}><Icon d={icons.edit} size={14} /></button>
                        <button onClick={() => setDeleteId(c.course_id)} style={{ background: "rgba(248,113,113,0.1)", border: "none", color: "#f87171", cursor: "pointer", borderRadius: 7, padding: "6px 8px", display: "flex" }}><Icon d={icons.trash} size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title={modal.mode === "add" ? "Add New Course" : "Edit Course"} onClose={() => { setModal(null); setUploadResult(null); }}>
          {uploadResult?.success ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
              <div style={{ fontSize: 18, color: "#4ade80", fontWeight: 600, marginBottom: 8 }}>SCORM Uploaded!</div>
              <div style={{ fontSize: 13, color: "#7a8aaa", marginBottom: 4 }}>Entry point detected:</div>
              <div style={{ fontSize: 12, color: "#818cf8", background: "rgba(91,110,245,0.1)", borderRadius: 8, padding: "8px 14px", marginBottom: 24, wordBreak: "break-all" }}>{uploadResult.entry_point}</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={() => { setModal(null); setUploadResult(null); }} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#7a8aaa", borderRadius: 9, padding: "10px 20px", cursor: "pointer", fontSize: 14 }}>Close</button>
                <Btn onClick={() => { setModal(null); setUploadResult(null); window.location.href = `/scorm-player/${uploadResult.courseId}`; }}>
                  <Icon d={icons.play} size={14} fill="#fff" stroke="#fff" /> Preview Now
                </Btn>
              </div>
            </div>
          ) : (
            <>
              <Field label="Course Title" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} />
              <Field label="Description (optional)" value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Instructor" value={form.instructor_id} onChange={v => setForm(p => ({ ...p, instructor_id: v }))} options={instOptions} />
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, letterSpacing: "0.08em", color: "#7a8aaa", textTransform: "uppercase", marginBottom: 6 }}>Category</label>
                  <input type="text" list="category-options" value={form.category ?? ""} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    placeholder="Select or type a category..."
                    style={{ width: "100%", background: "#0f1420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e0e8ff", padding: "10px 14px", fontSize: 14, boxSizing: "border-box" }}
                  />
                  <datalist id="category-options">
                    <option value="Programming" />
                    <option value="Web Dev" />
                    <option value="Backend" />
                    <option value="Data" />
                    <option value="Design" />
                  </datalist>
                </div>
              </div>
              <Field label="Status" value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={["published", "draft"]} />

              {/* ── Course Type Toggle ── */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 11, letterSpacing: "0.08em", color: "#7a8aaa", textTransform: "uppercase", marginBottom: 8 }}>Course Type</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { value: "manual", icon: "🧱", label: "Build Manually", sub: "Add modules, lessons & materials" },
                    { value: "scorm",  icon: "📦", label: "Upload SCORM",   sub: "Import a SCORM .zip package" },
                  ].map(opt => (
                    <div key={opt.value} onClick={() => setForm(p => ({ ...p, course_type: opt.value }))}
                      style={{ flex: 1, padding: "14px 16px", borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
                        border: form.course_type === opt.value ? "1px solid #5b6ef5" : "1px solid rgba(255,255,255,0.08)",
                        background: form.course_type === opt.value ? "rgba(91,110,245,0.1)" : "rgba(255,255,255,0.02)" }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{opt.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: form.course_type === opt.value ? "#818cf8" : "#c8d4f0", marginBottom: 3 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: "#4a5568" }}>{opt.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── SCORM file upload ── */}
              {form.course_type === "scorm" && (
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: 11, letterSpacing: "0.08em", color: "#7a8aaa", textTransform: "uppercase", marginBottom: 8 }}>SCORM Package (.zip)</label>
                  <div onClick={() => document.getElementById("scorm-zip-input").click()}
                    style={{ border: `2px dashed ${scormFile ? "#5b6ef5" : "rgba(255,255,255,0.12)"}`, borderRadius: 10, padding: "20px 16px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: scormFile ? "rgba(91,110,245,0.06)" : "rgba(255,255,255,0.02)" }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && f.name.endsWith(".zip")) setScormFile(f); }}>
                    <input id="scorm-zip-input" type="file" accept=".zip" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) setScormFile(e.target.files[0]); }} />
                    {scormFile ? (
                      <>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>📦</div>
                        <div style={{ fontSize: 13, color: "#818cf8", fontWeight: 600 }}>{scormFile.name}</div>
                        <div style={{ fontSize: 11, color: "#4a5568", marginTop: 3 }}>{(scormFile.size / 1024 / 1024).toFixed(2)} MB — click to change</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>📁</div>
                        <div style={{ fontSize: 13, color: "#7a8aaa" }}>Click or drag & drop your SCORM .zip</div>
                        <div style={{ fontSize: 11, color: "#4a5568", marginTop: 3 }}>imsmanifest.xml must be present</div>
                      </>
                    )}
                  </div>
                  {uploadResult?.error && (
                    <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, fontSize: 12, color: "#f87171" }}>⚠ {uploadResult.error}</div>
                  )}
                  {uploading && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#818cf8" }}>
                      <div style={{ width: 14, height: 14, border: "2px solid rgba(91,110,245,0.2)", borderTop: "2px solid #5b6ef5", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      Extracting and parsing imsmanifest.xml...
                    </div>
                  )}
                  {form.course_type === "scorm" && (
                 <ScormSettingsPanel settings={scormSettings} onChange={setScormSettings} />
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 8, justifyContent: "flex-end" }}>
                <button onClick={() => { setModal(null); setUploadResult(null); }} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#7a8aaa", borderRadius: 9, padding: "10px 20px", cursor: "pointer", fontSize: 14 }}>Cancel</button>
                <Btn onClick={save} disabled={saving || uploading}>
                  {uploading ? "Uploading SCORM..." : saving ? "Saving..." : modal.mode === "add" ? "Add Course" : "Save Changes"}
                </Btn>
              </div> 
              {/* ── SCORM Settings ── */}
                      {/* {form.course_type === "scorm" && (
                        <ScormSettingsPanel settings={scormSettings} onChange={setScormSettings} />
                      )} */}
            </>
          )}
        </Modal>
      )}

      {deleteId && (
        <Modal title="Delete Course?" onClose={() => setDeleteId(null)}>
          <p style={{ color: "#7a8aaa", fontSize: 14, marginTop: 0 }}>This will permanently delete the course, all its modules, lessons, and materials.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setDeleteId(null)} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#7a8aaa", borderRadius: 9, padding: "10px 20px", cursor: "pointer", fontSize: 14 }}>Cancel</button>
            <Btn danger onClick={() => del(deleteId)}>Delete</Btn>
          </div>
        </Modal>
      )}
      
    </div>
  );
};

// ── Users Tab ──────────────────────────────────────────────────────────────
const UsersTab = () => {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [tempPassword, setTempPassword] = useState(null); 
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/users`)
      .then(r => r.json()).then(d => { setUsers(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    (filter === "all" || u.role === filter) &&
    (`${u.firstname} ${u.lastname}`.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd  = () => { setForm({ firstname: "", lastname: "", email: "", role: "student", status: "active" }); setModal({ mode: "add" }); };
  const openEdit = (u) => { setForm({ ...u }); setModal({ mode: "edit" }); };

  const save = async () => {
    setSaving(true);
    try {
      if (modal.mode === "add") {
        const res = await fetch(`${API}/api/users`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        const d = await res.json();
        if (res.ok) {
          setUsers(p => [...p, { ...form, id: d.id }]);
          setTempPassword(d.temp_password);  // ← store it
          setModal(null);
        }
      } else {
        const res = await fetch(`${API}/api/users/${form.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (res.ok) setUsers(p => p.map(u => u.id === form.id ? form : u)); setModal(null);
      }
    } catch (e) { console.error(e); }
    setSaving(false); 
  };

  const del = async (id) => {
    const res = await fetch(`${API}/api/users/${id}`, { method: "DELETE" });
    const d = await res.json();
    if (res.ok) {
        setUsers(p => p.filter(u => u.id !== id));
        setDeleteId(null);
    } else {
        setDeleteId(null);
        setDeleteError(d.message|| "Failed to delete Instrcutor as still enrolled in course");
    }
};
  const toggleStatus = async (u) => {
    const s = u.status === "active" ? "suspended" : "active";
    const res = await fetch(`${API}/api/users/${u.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...u, status: s }) });
    if (res.ok) setUsers(p => p.map(x => x.id === u.id ? { ...x, status: s } : x));
  };

  const name     = (u) => `${u.firstname||""} ${u.lastname||""}`.trim() || u.email;
  const initials = (u) => `${(u.firstname||"")[0]||""}${(u.lastname||"")[0]||""}`.toUpperCase() || "?";

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4a5568" }}><Icon d={icons.search} size={16} /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
            style={{ width: "100%", background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#c8d4f0", padding: "10px 14px 10px 38px", fontSize: 14, boxSizing: "border-box" }} />
        </div>
        {["all","student","instructor"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ background: filter === f ? "#5b6ef5" : "rgba(255,255,255,0.05)", border: "none", color: filter === f ? "#fff" : "#7a8aaa", borderRadius: 9, padding: "10px 16px", cursor: "pointer", fontSize: 13, textTransform: "capitalize" }}>{f}</button>
        ))}
        <Btn onClick={openAdd}><Icon d={icons.plus} size={16} /> Add User</Btn>
      </div>

      <div style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
        {loading ? <Spinner /> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["User","Role","Joined","Status","Actions"].map(h => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#4a5568", fontSize: 14 }}>No users found</td></tr>
                : filtered.map((u, i) => (
                  <tr key={u.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(91,110,245,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: `hsl(${(u.id||1)*60},55%,35%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 600, flexShrink: 0 }}>{initials(u)}</div>
                        <div>
                          <div style={{ fontSize: 14, color: "#e0e8ff", fontWeight: 500 }}>{name(u)}</div>
                          <div style={{ fontSize: 12, color: "#4a5568" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: u.role === "instructor" ? "rgba(167,139,250,0.15)" : "rgba(91,110,245,0.15)", color: u.role === "instructor" ? "#a78bfa" : "#818cf8", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>{u.role}</span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#7a8aaa" }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ padding: "14px 16px" }}><Badge status={u.status || "active"} /></td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(u)} style={{ background: "rgba(91,110,245,0.15)", border: "none", color: "#5b6ef5", cursor: "pointer", borderRadius: 7, padding: "6px 8px", display: "flex" }}><Icon d={icons.edit} size={14} /></button>
                        <button onClick={() => toggleStatus(u)} style={{ background: u.status === "active" ? "rgba(251,191,36,0.1)" : "rgba(74,222,128,0.1)", border: "none", color: u.status === "active" ? "#fbbf24" : "#4ade80", cursor: "pointer", borderRadius: 7, padding: "6px 8px", display: "flex" }}>
                          <Icon d={u.status === "active" ? icons.shield : icons.check} size={14} />
                        </button>
                        <button onClick={() => setDeleteId(u.id)} style={{ background: "rgba(248,113,113,0.1)", border: "none", color: "#f87171", cursor: "pointer", borderRadius: 7, padding: "6px 8px", display: "flex" }}><Icon d={icons.trash} size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title={modal.mode === "add" ? "Add New User" : "Edit User"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="First Name" value={form.firstname} onChange={v => setForm(p => ({ ...p, firstname: v }))} />
            <Field label="Last Name"  value={form.lastname}  onChange={v => setForm(p => ({ ...p, lastname: v }))} />
          </div>
          <Field label="Email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} type="email" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Role"   value={form.role}   onChange={v => setForm(p => ({ ...p, role: v }))}   options={["student","instructor"]} />
            <Field label="Status" value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={["active","suspended"]} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setModal(null)} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#7a8aaa", borderRadius: 9, padding: "10px 20px", cursor: "pointer", fontSize: 14 }}>Cancel</button>
            <Btn onClick={save} disabled={saving}>{saving ? "Saving..." : modal.mode === "add" ? "Add User" : "Save Changes"}</Btn>
          </div>
        </Modal>
      )}
      {deleteId && (
        <Modal title="Remove User?" onClose={() => setDeleteId(null)}>
          <p style={{ color: "#7a8aaa", fontSize: 14, marginTop: 0 }}>This user will be permanently removed from the platform.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setDeleteId(null)} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#7a8aaa", borderRadius: 9, padding: "10px 20px", cursor: "pointer", fontSize: 14 }}>Cancel</button>
            <Btn danger onClick={() => del(deleteId)}>Remove</Btn>
          </div>
        </Modal>
      )}
      {deleteError && (
        <Modal title="Cannot Delete User" onClose={() => setDeleteError(null)}>
            <p style={{ color: "#f87171", fontSize: 14, marginTop: 0 }}>⚠ {deleteError}</p>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <Btn onClick={() => setDeleteError(null)}>OK</Btn>
            </div>
        </Modal>
    )}
    {tempPassword && (
        <Modal title="User Created!" onClose={() => setTempPassword(null)}>
          <p style={{ color: "#7a8aaa", fontSize: 14, marginBottom: 16 }}>
            Share this temporary password with the user. They should change it after first login.
          </p>
          <div style={{ background: "#0f1420", border: "1px solid rgba(91,110,245,0.3)", borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#818cf8", letterSpacing: 2 }}>{tempPassword}</span>
            <button
              onClick={() => navigator.clipboard.writeText(tempPassword)}
              style={{ background: "rgba(91,110,245,0.15)", border: "none", color: "#818cf8", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              Copy
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn onClick={() => setTempPassword(null)}>Done</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── Main Shell ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const navItems = [
    { id: "overview", label: "Overview", icon: icons.grid },
    { id: "courses",  label: "Courses",  icon: icons.book },
    { id: "users",    label: "Users",    icon: icons.users },
  ];
  const subtitles = { overview: "Platform health at a glance", courses: "Manage courses, modules & lessons", users: "Students and instructor accounts" };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,500&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <div style={{ display: "flex", height: "100vh", background: "#0d1117", fontFamily: "'DM Sans', sans-serif", color: "#c8d4f0", overflow: "hidden" }}>
        <aside style={{ width: 220, background: "#0f1420", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#5b6ef5,#4ade80)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎓</div>
              <span style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>Learn<span style={{ color: "#4ade80" }}>Sphere</span></span>
            </div>
          </div>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ background: "rgba(91,110,245,0.12)", border: "1px solid rgba(91,110,245,0.2)", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <Icon d={icons.shield} size={13} stroke="#5b6ef5" />
              <span style={{ fontSize: 11, color: "#5b6ef5", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Admin Panel</span>
            </div>
          </div>
          <nav style={{ flex: 1, padding: "12px 10px" }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 12px", borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 2, transition: "all 0.15s", textAlign: "left", background: activeTab === item.id ? "rgba(91,110,245,0.15)" : "transparent", color: activeTab === item.id ? "#818cf8" : "#4a5568" }}>
                <Icon d={item.icon} size={17} stroke={activeTab === item.id ? "#818cf8" : "#4a5568"} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
                {activeTab === item.id && <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: "#5b6ef5" }} />}
              </button>
            ))}
          </nav>

          {/* External Links */}
          <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={() => navigate("/admin-reports")}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: "rgba(74,222,128,0.1)", color: "#4ade80", textAlign: "left", transition: "all 0.15s" }}>
              <Icon d={icons.book} size={17} stroke="#4ade80" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Progress Reports</span>
            </button>
          </div>

          <div style={{ padding: "16px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 4 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#5b6ef5,#4ade80)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700 }}>A</div>
              <div>
                <div style={{ fontSize: 13, color: "#e0e8ff", fontWeight: 500 }}>Admin</div>
                <div style={{ fontSize: 11, color: "#4a5568" }}>admin@learn.edu</div>
              </div>
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 9, border: "none", cursor: "pointer", background: "transparent", color: "#4a5568" }}>
              <Icon d={icons.logout} size={15} stroke="#4a5568" />
              <span style={{ fontSize: 13 }}>Sign out</span>
            </button>
          </div>
        </aside>
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <header style={{ padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0d1117", flexShrink: 0 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontFamily: "'Playfair Display', serif", color: "#fff" }}>{navItems.find(n => n.id === activeTab)?.label}</h1>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "#4a5568" }}>{subtitles[activeTab]}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#7a8aaa", borderRadius: 10, padding: "9px 11px", cursor: "pointer", display: "flex" }}>
                <Icon d={icons.bell} size={17} />
              </button>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#5b6ef5,#4ade80)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", fontWeight: 700 }}>A</div>
            </div>
          </header>
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "courses"  && <CoursesTab />}
            {activeTab === "users"    && <UsersTab />}
          </div>
        </main>
      </div>
    </>
  );
}
