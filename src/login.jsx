import React, { useState, useEffect } from "react";
import App from "./App.jsx";
import logo from "./assets/logo.jpg";

function Login() {
  const demoUser = {
    email: "admin@primepower.com",
    password: "admin123",
    name: "Admin User",
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedSession = localStorage.getItem("primepower-session");
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session?.token) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      }
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      if (email === demoUser.email && password === demoUser.password) {
        const user = { email: demoUser.email, name: demoUser.name };
        localStorage.setItem(
          "primepower-session",
          JSON.stringify({ token: "demo-session", user })
        );
        setMessage(`Welcome, ${user.name}!`);
        setLoggedIn(true);
        return;
      }

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const responseText = await response.text();
      let data = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error("The login service returned an invalid response.");
        }
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Login failed.");
      }

      localStorage.setItem(
        "primepower-session",
        JSON.stringify({
          token: data.token,
          user: data.user,
        })
      );

      setMessage(`Welcome, ${data.user.name}!`);
      setLoggedIn(true);
    } catch (error) {
      setMessage(error.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loggedIn) {
    return <App />;
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-brand-panel">
          <div className="login-brand-top">
            <img src={logo} alt="PrimePower Logo" className="login-logo" />
            <div>
              <span className="login-kicker">PrimePower Manpower</span>
              <h1>Finance Management</h1>
            </div>
          </div>

          <div className="login-brand-copy">
            <span className="login-tag">Financial Control Center</span>
            <h2>Welcome to PrimePower Manpower</h2>
            <p>
              Manage billing, payroll, collections, payments,
              reporting, and compliance from one secure system.
            </p>
          </div>
        </section>

        <section className="login-card">
          <div className="login-card-header">
            <div>
              <span className="login-card-kicker">Account Access</span>
              <h2>Sign In</h2>
            </div>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                placeholder="name@primepower.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div className="password-row">
                <label htmlFor="password">Password</label>
              </div>
              <input
                type="password"
                id="password"
                value={password}
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login to Dashboard"}
            </button>

            {message && <p className="login-message">{message}</p>}
          </form>

        </section>
      </div>
    </div>
  );
}

export default Login;
