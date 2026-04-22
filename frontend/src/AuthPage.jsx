import { useState, useEffect } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0b0f1a;
    --panel: #111827;
    --card: #161d2e;
    --border: rgba(255,255,255,0.07);
    --accent: #6ee7b7;
    --accent2: #3b82f6;
    --accent3: #f59e0b;
    --text: #f0f4ff;
    --muted: #6b7a99;
    --error: #f87171;
    --success: #6ee7b7;
    --input-bg: rgba(255,255,255,0.04);
    --input-border: rgba(255,255,255,0.1);
    --input-focus: rgba(110,231,183,0.4);
  }

  .auth-root {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    overflow: hidden;
    position: relative;
  }

  /* ── Animated mesh background ── */
  .auth-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.18;
    animation: float 12s ease-in-out infinite;
  }
  .orb-1 { width: 600px; height: 600px; background: #3b82f6; top: -200px; left: -150px; animation-delay: 0s; }
  .orb-2 { width: 400px; height: 400px; background: #6ee7b7; bottom: -100px; right: -100px; animation-delay: -4s; }
  .orb-3 { width: 300px; height: 300px; background: #f59e0b; top: 40%; left: 60%; animation-delay: -8s; }
  @keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -40px) scale(1.05); }
    66% { transform: translate(-20px, 20px) scale(0.97); }
  }

  /* Grid pattern */
  .auth-bg::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  /* ── Left panel ── */
  .left-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 60px;
    position: relative;
    z-index: 1;
    max-width: 520px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 64px;
  }
  .brand-icon {
    width: 44px; height: 44px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
  }
  .brand-name {
    font-family: 'Fraunces', serif;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.5px;
    color: var(--text);
  }
  .brand-name span { color: var(--accent); }

  .hero-text {
    margin-bottom: 48px;
  }
  .hero-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 16px;
  }
  .hero-title {
    font-family: 'Fraunces', serif;
    font-size: clamp(36px, 4vw, 52px);
    font-weight: 300;
    line-height: 1.15;
    color: var(--text);
    margin-bottom: 18px;
  }
  .hero-title em {
    font-style: italic;
    color: var(--accent);
  }
  .hero-sub {
    font-size: 16px;
    color: var(--muted);
    line-height: 1.6;
    max-width: 340px;
  }

  .stats-row {
    display: flex;
    gap: 32px;
  }
  .stat { }
  .stat-num {
    font-family: 'Fraunces', serif;
    font-size: 28px;
    font-weight: 600;
    color: var(--text);
    line-height: 1;
  }
  .stat-lbl {
    font-size: 12px;
    color: var(--muted);
    margin-top: 4px;
  }
  .stat-divider {
    width: 1px;
    background: var(--border);
    align-self: stretch;
  }

  .testimonial {
    margin-top: 48px;
    padding: 20px 24px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: 8px;
  }
  .testimonial p {
    font-size: 14px;
    color: var(--muted);
    line-height: 1.6;
    font-style: italic;
  }
  .testimonial-author {
    margin-top: 12px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.5px;
  }

  /* ── Right panel (form) ── */
  .right-panel {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    position: relative;
    z-index: 1;
  }

  .form-card {
    width: 100%;
    max-width: 460px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 40px;
    box-shadow: 0 40px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset;
    animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Tab switcher */
  .tab-switcher {
    display: flex;
    background: rgba(255,255,255,0.04);
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 32px;
    position: relative;
  }
  .tab-pill {
    position: absolute;
    top: 4px; bottom: 4px;
    width: calc(50% - 4px);
    background: linear-gradient(135deg, var(--accent2), #4f46e5);
    border-radius: 9px;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 12px rgba(59,130,246,0.3);
  }
  .tab-pill.right { transform: translateX(calc(100% + 0px)); left: 4px; }
  .tab-pill.left { transform: translateX(0); left: 4px; }

  .tab-btn {
    flex: 1;
    padding: 10px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: var(--muted);
    position: relative;
    z-index: 1;
    transition: color 0.3s;
    border-radius: 9px;
  }
  .tab-btn.active { color: white; }

  /* Form heading */
  .form-heading { margin-bottom: 28px; }
  .form-title {
    font-family: 'Fraunces', serif;
    font-size: 26px;
    font-weight: 400;
    color: var(--text);
    margin-bottom: 6px;
  }
  .form-sub { font-size: 13px; color: var(--muted); }

  /* Input groups */
  .form-row { display: flex; gap: 12px; }
  .form-row .form-group { flex: 1; }

  .form-group {
    margin-bottom: 18px;
  }
  .form-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: var(--muted);
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  .input-wrap {
    position: relative;
  }
  .input-icon {
    position: absolute;
    left: 14px; top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
    font-size: 16px;
    pointer-events: none;
    transition: color 0.2s;
  }
  .form-input {
    width: 100%;
    padding: 13px 14px 13px 42px;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: 10px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    transition: all 0.2s;
    outline: none;
  }
  .form-input::placeholder { color: rgba(107,122,153,0.6); }
  .form-input:focus {
    border-color: var(--accent);
    background: rgba(110,231,183,0.04);
    box-shadow: 0 0 0 3px var(--input-focus);
  }
  .form-input:focus + .input-icon,
  .input-wrap:focus-within .input-icon { color: var(--accent); }

  .form-input.has-toggle { padding-right: 44px; }

  .toggle-pass {
    position: absolute;
    right: 14px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none;
    cursor: pointer; color: var(--muted);
    font-size: 15px; transition: color 0.2s;
    display: flex; align-items: center;
  }
  .toggle-pass:hover { color: var(--accent); }

  .input-error { border-color: var(--error) !important; }
  .error-msg {
    font-size: 11px;
    color: var(--error);
    margin-top: 5px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* Role selector */
  .role-group { margin-bottom: 18px; }
  .role-options { display: flex; gap: 10px; margin-top: 8px; }
  .role-btn {
    flex: 1; padding: 10px 8px;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: 10px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: var(--muted);
    transition: all 0.2s;
    text-align: center;
  }
  .role-btn.selected {
    border-color: var(--accent);
    background: rgba(110,231,183,0.08);
    color: var(--accent);
    font-weight: 600;
  }
  .role-icon { display: block; font-size: 20px; margin-bottom: 4px; }

  /* Strength bar */
  .strength-wrap { margin-top: 6px; }
  .strength-bars { display: flex; gap: 4px; margin-bottom: 4px; }
  .strength-bar {
    flex: 1; height: 3px; border-radius: 2px;
    background: rgba(255,255,255,0.08);
    transition: background 0.3s;
  }
  .strength-bar.active-weak { background: var(--error); }
  .strength-bar.active-ok { background: var(--accent3); }
  .strength-bar.active-strong { background: var(--accent); }
  .strength-label { font-size: 11px; color: var(--muted); }

  /* Remember / forgot */
  .form-extras {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 22px;
  }
  .checkbox-wrap { display: flex; align-items: center; gap: 8px; cursor: pointer; }
  .checkbox-wrap input { display: none; }
  .custom-cb {
    width: 16px; height: 16px;
    border: 1px solid var(--input-border);
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .custom-cb.checked {
    background: var(--accent);
    border-color: var(--accent);
    color: #0b0f1a;
    font-size: 11px;
  }
  .cb-label { font-size: 13px; color: var(--muted); }
  .forgot-link {
    font-size: 13px; color: var(--accent);
    text-decoration: none; cursor: pointer;
    background: none; border: none; font-family: 'DM Sans', sans-serif;
    transition: opacity 0.2s;
  }
  .forgot-link:hover { opacity: 0.7; }

  /* Submit button */
  .submit-btn {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, var(--accent2), #4f46e5);
    border: none;
    border-radius: 12px;
    color: white;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(59,130,246,0.35);
    letter-spacing: 0.3px;
  }
  .submit-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .submit-btn:hover::after { opacity: 1; }
  .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(59,130,246,0.45); }
  .submit-btn:active { transform: translateY(0); }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .btn-content { display: flex; align-items: center; justify-content: center; gap: 8px; }
  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Divider */
  .divider {
    display: flex; align-items: center; gap: 12px;
    margin: 20px 0; color: var(--muted); font-size: 12px;
  }
  .divider::before, .divider::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }

  /* Social buttons */
  .social-row { display: flex; gap: 10px; }
  .social-btn {
    flex: 1; padding: 11px;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: 10px;
    cursor: pointer;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: all 0.2s;
  }
  .social-btn:hover {
    border-color: rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.06);
  }

  /* Success state */
  .success-state {
    text-align: center;
    padding: 20px 0;
    animation: slideUp 0.4s ease;
  }
  .success-icon {
    width: 64px; height: 64px;
    background: rgba(110,231,183,0.15);
    border: 2px solid var(--accent);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px;
    margin: 0 auto 16px;
  }
  .success-title {
    font-family: 'Fraunces', serif;
    font-size: 22px; margin-bottom: 8px;
  }
  .success-sub { font-size: 14px; color: var(--muted); }

  /* Terms */
  .terms-note { font-size: 11px; color: var(--muted); text-align: center; margin-top: 16px; line-height: 1.5; }
  .terms-note a { color: var(--accent); cursor: pointer; }

  /* Toast */
  .toast {
    position: fixed; top: 24px; right: 24px; z-index: 1000;
    background: var(--card);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: 10px;
    padding: 14px 18px;
    font-size: 13px;
    color: var(--text);
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    animation: toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    max-width: 300px;
  }
  @keyframes toastIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }

  @media (max-width: 860px) {
    .left-panel { display: none; }
    .right-panel { padding: 24px; }
    .form-card { padding: 28px 24px; }
  }
`;

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
);

function PasswordStrength({ password }) {
  const getStrength = () => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };
  const s = getStrength();
  const label = s === 0 ? '' : s === 1 ? 'Weak' : s === 2 ? 'Fair' : s === 3 ? 'Good' : 'Strong';
  const cls = s <= 1 ? 'active-weak' : s <= 2 ? 'active-ok' : 'active-strong';
  if (!password) return null;
  return (
    <div className="strength-wrap">
      <div className="strength-bars">
        {[1,2,3,4].map(i => <div key={i} className={`strength-bar ${i <= s ? cls : ''}`} />)}
      </div>
      <div className="strength-label">{label}</div>
    </div>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ firstName: '', lastName: '', email: '', password: '',role: '', instructor_id:''});

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const validateLogin = () => {
    const e = {};
    if (!loginForm.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(loginForm.email)) e.email = 'Enter a valid email';
    if (!loginForm.password) e.password = 'Password is required';
    return e;
  };

  const validateReg = () => {
    const e = {};
    if (!regForm.firstName.trim()) e.firstName = 'Required';
    if (!regForm.lastName.trim()) e.lastName = 'Required';
    if (!regForm.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(regForm.email)) e.email = 'Enter a valid email';
    if (!regForm.password) e.password = 'Password is required';
    else if (regForm.password.length < 8) e.password = 'At least 8 characters';
    return e;
  };

 const handleLogin = async () => {

  const API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname.startsWith("192.168.") ? "http://" + window.location.hostname + ":8080" : "https://lms-project-production-ba53.up.railway.app";
  const response = await fetch(`${API}/login`,{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body: JSON.stringify(loginForm)
  })

  
  
  if(response.ok){
    const data = await response.json()
    sessionStorage.setItem("user_id", data.user_id);
    sessionStorage.setItem("role", data.role);
    //re routing based on ROLE
    if(data.role === "student"){
      window.location.href="/student-dashboard"
    }

    else if(data.role === "instructor"){
      window.location.href="/instructor-dashboard"
    }

    else if(data.role === "admin"){
      window.location.href="/admin-dashboard"
    }

  }else{
    alert("Invalid credentials")
  }

};
  
  const handleRegister = async () => {

  const API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname.startsWith("192.168.") ? "http://" + window.location.hostname + ":8080" : "https://lms-project-production-ba53.up.railway.app";
  const response = await fetch(`${API}/register`,{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body: JSON.stringify(regForm)
  })

  const data = await response.json()

  console.log(data)

  if(response.ok){
    setSuccess(true)
  }
  else{
    alert(data.error || data.message)
  }
};

  const switchTab = (t) => {
    setTab(t); setErrors({}); setSuccess(false); setLoading(false);
  };

  return (
    <>
      <style>{styles}</style>
      {toast && <div className="toast">{toast}</div>}
      <div className="auth-root">
        <div className="auth-bg">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        {/* Left panel */}
        <div className="left-panel">
          <div className="brand">
            <div className="brand-icon">🎓</div>
            <div className="brand-name">Learn<span>Sphere</span></div>
          </div>

          <div className="hero-text">
            <div className="hero-label">Learning Management System</div>
            <h1 className="hero-title">
              Knowledge,<br />
              <em>beautifully</em><br />
              organised.
            </h1>
            <p className="hero-sub">
              The modern platform where instructors and students come together to teach, learn, and grow.
            </p>
          </div>

          <div className="stats-row">
            <div className="stat">
              <div className="stat-num">48k+</div>
              <div className="stat-lbl">Active Students</div>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <div className="stat-num">1,200</div>
              <div className="stat-lbl">Expert Courses</div>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <div className="stat-num">98%</div>
              <div className="stat-lbl">Satisfaction</div>
            </div>
          </div>

          <div className="testimonial">
            <p>"LearnSphere completely transformed how I teach my Python courses. The interface is intuitive and students are more engaged than ever."</p>
            <div className="testimonial-author">— Dr. Sarah Chen, Software Engineering</div>
          </div>
        </div>

        {/* Right panel */}
        <div className="right-panel">
          <div className="form-card">

            {/* Tab switcher */}
            <div className="tab-switcher">
              <div className={`tab-pill ${tab === 'register' ? 'right' : 'left'}`} />
              <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>Sign In</button>
              <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>Create Account</button>
            </div>

            {success ? (
              <div className="success-state">
                <div className="success-icon">🎉</div>
                <div className="success-title">Account Created!</div>
                <p className="success-sub" style={{marginBottom: 24}}>Welcome to LearnSphere. Check your email to verify your account and start learning.</p>
                <button className="submit-btn" onClick={() => { setSuccess(false); setTab('login'); }}>
                  Sign In Now →
                </button>
              </div>
            ) : tab === 'login' ? (
              <div key="login">
                <div className="form-heading">
                  <div className="form-title">Welcome back 👋</div>
                  <div className="form-sub">Sign in to continue your learning journey</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrap">
                    <input
                      className={`form-input ${errors.email ? 'input-error' : ''}`}
                      type="email" placeholder="you@example.com"
                      value={loginForm.email}
                      onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                    />
                    <span className="input-icon">✉</span>
                  </div>
                  {errors.email && <div className="error-msg">⚠ {errors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrap">
                    <input
                      className={`form-input has-toggle ${errors.password ? 'input-error' : ''}`}
                      type={showPass ? 'text' : 'password'} placeholder="••••••••"
                      value={loginForm.password}
                      onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                    />
                    <span className="input-icon">🔒</span>
                    <button className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                  {errors.password && <div className="error-msg">⚠ {errors.password}</div>}
                </div>

                <div className="form-extras">
                  <label className="checkbox-wrap" onClick={() => setRemember(!remember)}>
                    <div className={`custom-cb ${remember ? 'checked' : ''}`}>{remember ? '✓' : ''}</div>
                    <span className="cb-label">Remember me</span>
                  </label>
                  <button className="forgot-link">Forgot password?</button>
                </div>

                <button className="submit-btn" onClick={handleLogin} disabled={loading}>
                  <div className="btn-content">
                    {loading ? <><div className="spinner" /> Signing in...</> : <>Sign In →</>}
                  </div>
                </button>

                <div className="divider">or continue with</div>
                <div className="social-row">
                  <button className="social-btn"><GoogleIcon /> Google</button>
                  <button className="social-btn">🎓 Campus SSO</button>
                </div>
              </div>

            ) : (
              <div key="register">
                <div className="form-heading">
                  <div className="form-title">Start learning today</div>
                  <div className="form-sub">Create your free account in seconds</div>
                </div>

                {/* Role */}
                <div className="role-group">
                  <label className="form-label">I am joining as</label>
                  <div className="role-options">
                    {[{id:'student',icon:'🧑‍💻',label:'Student'},{id:'instructor',icon:'👩‍🏫',label:'Instructor'}].map(r => (
                        <button
                          key={r.id}
                          type="button"
                          className={`role-btn ${regForm.role === r.id ? 'selected' : ''}`}
                          onClick={() => setRegForm({...regForm, role: r.id})}
                        >
                          <span className="role-icon">{r.icon}</span>
                          {r.label}
                        </button>
                      ))}
                  </div>
                </div>
                <>
                {regForm.role === "instructor" && (
                  <div className="form-group">
                    <label className="form-label">Instructor ID</label>
                    <div className="input-wrap">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter Instructor ID"
                        value={regForm.instructor_id}
                        onChange={(e)=>setRegForm({...regForm, instructor_id:e.target.value})}
                      />
                      <span className="input-icon">🆔</span>
                    </div>
                  </div>
                )}
                </>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <div className="input-wrap">
                      <input
                        className={`form-input ${errors.firstName ? 'input-error' : ''}`}
                        type="text" placeholder="Jane"
                        value={regForm.firstName}
                        onChange={e => setRegForm({...regForm, firstName: e.target.value})}
                      />
                      <span className="input-icon">👤</span>
                    </div>
                    {errors.firstName && <div className="error-msg">⚠ {errors.firstName}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <div className="input-wrap">
                      <input
                        className={`form-input ${errors.lastName ? 'input-error' : ''}`}
                        type="text" placeholder="Doe"
                        value={regForm.lastName}
                        onChange={e => setRegForm({...regForm, lastName: e.target.value})}
                      />
                      <span className="input-icon">👤</span>
                    </div>
                    {errors.lastName && <div className="error-msg">⚠ {errors.lastName}</div>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrap">
                    <input
                      className={`form-input ${errors.email ? 'input-error' : ''}`}
                      type="email" placeholder="you@example.com"
                      value={regForm.email}
                      onChange={e => setRegForm({...regForm, email: e.target.value})}
                    />
                    <span className="input-icon">✉</span>
                  </div>
                  {errors.email && <div className="error-msg">⚠ {errors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrap">
                    <input
                      className={`form-input has-toggle ${errors.password ? 'input-error' : ''}`}
                      type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters"
                      value={regForm.password}
                      onChange={e => setRegForm({...regForm, password: e.target.value})}
                    />
                    <span className="input-icon">🔒</span>
                    <button className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                  {errors.password && <div className="error-msg">⚠ {errors.password}</div>}
                  <PasswordStrength password={regForm.password} />
                </div>

                <button className="submit-btn" onClick={handleRegister} disabled={loading}>
                  <div className="btn-content">
                    {loading ? <><div className="spinner" /> Creating account...</> : <>Create Account →</>}
                  </div>
                </button>

                <p className="terms-note">
                  By registering, you agree to our <a>Terms of Service</a> and <a>Privacy Policy</a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
