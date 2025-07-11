// mazearning/src/pages/ResetPassword.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNotification } from "../contexts/NotificationContext";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Replace with your real API endpoint
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!response.ok) throw new Error("Failed to reset password");
      showNotification("Password reset successful!", "success");
      navigate("/login");
    } catch (err) {
      showNotification("Failed to reset password.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Set New Password</h2>
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      /><br />
      <button type="submit" disabled={loading}>
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}
