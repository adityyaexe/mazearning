// mazearning/src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import { useNotification } from "../contexts/NotificationContext";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Replace with your real API endpoint
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Failed to send reset email");
      showNotification("Password reset link sent! Check your email.", "success");
    } catch (err) {
      showNotification("Failed to send reset email. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Forgot Password</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      /><br />
      <button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
    </form>
  );
}
