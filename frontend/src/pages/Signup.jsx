import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Sparkles, UtensilsCrossed } from "lucide-react";
import api from "../services/api";
import { normalizeDob } from "../utils/dob";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    registration_number: "",
    email: "",
    dob: "",
  });
  const [dobError, setDobError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === "dob" ? value.replace(/\D/g, "").slice(0, 8) : value,
    }));
    if (name === "dob") setDobError("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    const dob = normalizeDob(form.dob);
    if (!dob) {
      setDobError("Enter a valid date in DDMMYYYY format, such as 15012006.");
      return;
    }

    setDobError("");
    setLoading(true);
    try {
      await api.post("/api/auth/signup", {
        name: form.name.trim(),
        registration_number: form.registration_number.trim(),
        email: form.email.trim(),
        dob,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Unable to create your account.");
    } finally {
      setLoading(false);
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
          <p className="eyebrow">Good food is better together</p>
          <h1>Your campus<br />canteen, made easy.</h1>
          <p>Create your student account to browse the canteen menu, order ahead and keep track of your pickup token.</p>
        </div>
        <div className="login-visual__foot"><Sparkles size={16} /> Student accounts are ready in a moment.</div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <p className="eyebrow"><GraduationCap size={14} /> STUDENT ACCOUNT</p>
          <h2>Create account</h2>
          <p>Use your campus details to get started.</p>

          {success ? (
            <div className="signup-success" role="status">
              <span className="signup-success__icon">✓</span>
              <h3>You're on the list.</h3>
              <p>Your student account has been created. Sign in with your registration number and date of birth to place an order.</p>
              <Link to="/login" className="button">Go to sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label htmlFor="signup-name">Full name</label>
              <input id="signup-name" name="name" value={form.name} onChange={handleChange} placeholder="Your name" autoComplete="name" minLength={2} maxLength={100} required />

              <label htmlFor="signup-registration">Registration number</label>
              <input id="signup-registration" name="registration_number" value={form.registration_number} onChange={handleChange} placeholder="24CSR134" autoComplete="username" minLength={3} maxLength={30} required />

              <label htmlFor="signup-email">Email address</label>
              <input id="signup-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@college.edu" autoComplete="email" required />

              <label htmlFor="signup-dob">Date of birth</label>
              <input
                id="signup-dob"
                name="dob"
                type="text"
                inputMode="numeric"
                maxLength={8}
                placeholder="15012006"
                value={form.dob}
                onChange={handleChange}
                autoComplete="bday"
                aria-describedby={dobError ? "signup-dob-error" : "signup-dob-help"}
                required
              />
              <span id={dobError ? "signup-dob-error" : "signup-dob-help"} className={dobError ? "field-error" : "field-help"}>
                {dobError || "Enter your date of birth as DDMMYYYY, for example 15012006."}
              </span>

              {error && <p className="alert" role="alert">{error}</p>}
              <button type="submit" disabled={loading}>{loading ? "Creating account..." : <>Create student account <span aria-hidden="true">→</span></>}</button>
            </form>
          )}

          {!success && <p className="login-switch">Already registered? <Link to="/login">Sign in</Link></p>}
          <p className="login-footnote">Student signup creates student access only. Staff accounts are managed by an administrator.</p>
        </div>
      </section>
    </main>
  );
}
