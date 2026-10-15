
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://127.0.0.1:5000";

function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setMessage("");
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const response = await axios.post(`${API_URL}/register`, {
          username: username.trim(),
          email: email.trim(),
          password,
        });

        setMessage(
          response.data.message || "Account created. You can now log in."
        );
        setMode("login");
        setPassword("");
        setConfirmPassword("");
      } else {
        const response = await axios.post(`${API_URL}/login`, {
          username: username.trim(),
          password,
        });

        setMessage(response.data.message || "Login successful.");

        // This navigates after the backend verifies the credentials.
        // Session/token protection for patient endpoints is a separate
        // security step we still need to implement.
        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to connect to the server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-decoration">
        <div className="auth-brand">
          <span className="auth-logo">H+</span>
          <span>HealthTrack</span>
        </div>

        <div className="auth-intro">
          <span className="auth-eyebrow">HEALTH PREDICTION SYSTEM</span>
          <h1>Better records.<br />Clearer insights.</h1>
          <p>
            Manage patient information and review rule-based health indicators
            in one place.
          </p>

          <div className="auth-feature">
            <span>✓</span>
            <div>
              <strong>Patient management</strong>
              <p>Organize and maintain patient records.</p>
            </div>
          </div>

          <div className="auth-feature">
            <span>✓</span>
            <div>
              <strong>Health indicator summaries</strong>
              <p>Review the remarks recorded by the application.</p>
            </div>
          </div>
        </div>

        <p className="auth-note">
          For development and demonstration purposes.
        </p>
      </div>

      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="auth-logo">H+</span>
            <strong>HealthTrack</strong>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={!isRegister ? "selected" : ""}
              onClick={() => switchMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={isRegister ? "selected" : ""}
              onClick={() => switchMode("register")}
            >
              Register
            </button>
          </div>

          <h2>{isRegister ? "Create your account" : "Welcome back"}</h2>
          <p className="auth-subtitle">
            {isRegister
              ? "Fill in your details to get started."
              : "Enter your account details to continue."}
          </p>

          {message && (
            <div className="auth-success" role="status">
              {message}
            </div>
          )}

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="auth-label">
              Username
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                minLength={3}
                maxLength={50}
                required
              />
            </label>

            {isRegister && (
              <label className="auth-label">
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={100}
                  required
                />
              </label>
            )}

            <label className="auth-label">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isRegister ? "At least 8 characters" : "Enter password"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={isRegister ? 8 : undefined}
                maxLength={128}
                required
              />
            </label>

            {isRegister && (
              <label className="auth-label">
                Confirm password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Enter password again"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                />
              </label>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isRegister
                ? "Create account"
                : "Login"}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(isRegister ? "login" : "register")}
            >
              {isRegister ? "Login" : "Register"}
            </button>
          </p>

          <p className="auth-disclaimer">
            Health indicators shown by this application are not medical
            diagnoses.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
