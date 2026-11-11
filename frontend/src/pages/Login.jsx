import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, GraduationCap, ShieldCheck, Sparkles, UtensilsCrossed } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { normalizeDob } from "../utils/dob";

export default function Login() {
  const [role, setRole] = useState("student");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [dob, setDob] = useState("");
  const [dobError, setDobError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const normalizedDob = role === "student" ? normalizeDob(dob) : null;
    if (role === "student" && !normalizedDob) {
      setDobError("Enter a valid date in DDMMYYYY format, such as 15012006.");
      return;
    }
    setDobError("");

    try {
      const credentials = role === "student"
        ? { registration_number: registrationNumber, dob: normalizedDob }
        : { registration_number: registrationNumber, password };
      const user = await login(credentials, role);
      navigate(user.role === "admin" ? "/admin" : user.role === "kitchen" ? "/kitchen" : "/");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <Link to="/login" className="brand-mark" aria-label="MasalaCafe">
          <span className="brand-mark__icon"><UtensilsCrossed size={19} /></span>
          <span className="brand-mark__name">Masala<span>Cafe</span></span>
        </Link>
        <div className="login-visual__copy">
          <p className="eyebrow">A little joy between classes</p>
          <h1>Good food.<br />Better campus days.</h1>
          <p>Your favorite canteen classics, made fresh and ready when you are. Find something delicious and let us handle the rest.</p>
        </div>
        <div className="login-visual__foot"><Sparkles size={16} /> Made for campus life, served with care.</div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <p className="eyebrow">Welcome to MasalaCafe</p>
          <h2>Sign in</h2>
          <p>Choose your account type to continue.</p>

          <div className="role-selector role-selector--three-col" aria-label="Choose account type">
            <button type="button" className={role === "student" ? "active" : ""} onClick={() => { setRole("student"); setPasswordVisible(false); setError(""); setDobError(""); }}>
              <GraduationCap size={17} /> Student
            </button>
            <button type="button" className={role === "admin" ? "active" : ""} onClick={() => { setRole("admin"); setPasswordVisible(false); setError(""); setDobError(""); }}>
              <ShieldCheck size={16} /> Admin
            </button>
            <button type="button" className={role === "kitchen" ? "active" : ""} onClick={() => { setRole("kitchen"); setPasswordVisible(false); setError(""); setDobError(""); }}>
              <UtensilsCrossed size={16} /> Kitchen
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="registration-number">{role === "student" ? "Registration number" : role === "kitchen" ? "Kitchen ID" : "Admin ID"}</label>
            <input
              id="registration-number"
              value={registrationNumber}
              onChange={(event) => setRegistrationNumber(event.target.value)}
              placeholder={
                role === "student"
                  ? "e.g., 24CSR134"
                  : role === "admin"
                    ? "Enter admin ID"
                    : "Enter kitchen ID"
              }
              autoComplete="username"
              required
            />
            {role === "student" ? (
              <>
                <label htmlFor="student-dob">Date of birth</label>
                <input
                  id="student-dob"
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="e.g., 15012006"
                  value={dob}
                  onChange={(event) => { setDobError(""); setDob(event.target.value.replace(/\D/g, "").slice(0, 8)); }}
                  autoComplete="bday"
                  aria-describedby={dobError ? "student-dob-error" : "student-dob-help"}
                  required
                />
                <span id={dobError ? "student-dob-error" : "student-dob-help"} className={dobError ? "field-error" : "field-help"}>
                  {dobError || "Enter your date of birth as DDMMYYYY, for example 15012006."}
                </span>
              </>
            ) : (
              <>
                <label htmlFor="login-password">Password</label>
                <div className="login-password-field">
                  <input id="login-password" type={passwordVisible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
                  <button
                    className="login-password-toggle"
                    type="button"
                    onClick={() => setPasswordVisible((visible) => !visible)}
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                    aria-pressed={passwordVisible}
                  >
                    {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </>
            )}
            {error && <p className="alert" role="alert">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : <>Continue <span aria-hidden="true">→</span></>}
            </button>
          </form>
          {role === "student" && <p className="login-switch">New to MasalaCafe? <Link to="/signup">Create your student account</Link></p>}
          {role === "kitchen" && <p className="login-switch">Kitchen accounts are created by an administrator. Ask your canteen admin for your Kitchen ID.</p>}
          <p className="login-footnote">Your canteen, one easy order away. Need help? Ask the canteen team.</p>
        </div>
      </section>
    </main>
  );
}
