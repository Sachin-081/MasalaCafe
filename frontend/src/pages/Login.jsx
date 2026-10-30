
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [role, setRole] = useState("student");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login, loading } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const credentials =
        role === "student"
          ? {
              registration_number: registrationNumber,
              dob: dob
                ? dob.split("-").reverse().join("")
                : "",
            }
          : {
              registration_number: registrationNumber,
              password,
            };

      const user = await login(credentials, role);

      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <h1>MasalaCafe</h1>
        <p>Fresh food. Easy ordering.</p>

        <div className="role-selector">
          <button
            type="button"
            className={role === "student" ? "active" : ""}
            onClick={() => setRole("student")}
          >
            Student
          </button>

          <button
            type="button"
            className={role === "admin" ? "active" : ""}
            onClick={() => setRole("admin")}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Registration Number</label>
          <input
            value={registrationNumber}
            onChange={(event) =>
              setRegistrationNumber(event.target.value)
            }
            placeholder="Enter registration number"
            required
          />

          {role === "student" ? (
            <>
              <label>Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(event) => setDob(event.target.value)}
                required
              />
            </>
          ) : (
            <>
              <label>Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                required
              />
            </>
          )}

          {error && <p className="error-message">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}
