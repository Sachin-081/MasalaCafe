import { useState } from "react";
import { Check, KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import api from "../../services/api";

const initialForm = { name: "", registration_number: "", email: "", password: "" };

export default function KitchenUsers() {
  const [form, setForm] = useState(initialForm);
  const [createdUser, setCreatedUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
    setCreatedUser(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setCreatedUser(null);
    setLoading(true);
    try {
      const user = await api.post("/api/auth/kitchen-users", {
        ...form,
        name: form.name.trim(),
        registration_number: form.registration_number.trim(),
        email: form.email.trim(),
      });
      setCreatedUser(user);
      setForm(initialForm);
    } catch (err) {
      setError(err.message || "Unable to create kitchen account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sidebar title="Kitchen accounts" subtitle="Create secure kitchen staff accounts. Only signed-in administrators can provision kitchen access." eyebrow="Team access">
      {error && <p className="alert" role="alert">{error}</p>}
      {createdUser && (
        <div className="alert alert--success kitchen-user-success" role="status">
          <Check size={17} />
          <span>Kitchen account created for <strong>{createdUser.name}</strong> ({createdUser.registration_number}). Share the Kitchen ID and initial password with them securely.</span>
        </div>
      )}
      <section className="panel admin-form-panel">
        <div className="panel__header"><h2><UserPlus size={18} /> Add kitchen team member</h2></div>
        <div className="panel__body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field"><label htmlFor="kitchen-name">Full name</label><input id="kitchen-name" name="name" value={form.name} onChange={handleChange} minLength={2} maxLength={100} required /></div>
              <div className="form-field"><label htmlFor="kitchen-id">Kitchen ID</label><input id="kitchen-id" name="registration_number" value={form.registration_number} onChange={handleChange} minLength={3} maxLength={30} required /></div>
              <div className="form-field form-field--wide"><label htmlFor="kitchen-email">Email address</label><input id="kitchen-email" name="email" type="email" value={form.email} onChange={handleChange} required /></div>
              <div className="form-field form-field--wide"><label htmlFor="kitchen-password">Initial password</label><input id="kitchen-password" name="password" type="password" value={form.password} onChange={handleChange} minLength={8} maxLength={128} autoComplete="new-password" required /></div>
            </div>
            <div className="form-actions"><button className="button" type="submit" disabled={loading}>{loading ? "Creating account..." : <><ShieldCheck size={16} /> Create kitchen account</>}</button></div>
          </form>
        </div>
      </section>
      <section className="feature-unavailable kitchen-account-note">
        <KeyRound size={20} />
        <div><h2>Kitchen accounts are not public signups</h2><p>Only an authenticated admin can create an account. Kitchen staff sign in using the Kitchen ID and initial password set here; no admin or kitchen role can be selected on student signup.</p></div>
      </section>
    </Sidebar>
  );
}
