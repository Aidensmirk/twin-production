import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const profile = await login(form.username, form.password);
      navigate(profile?.onboarded ? "/home" : "/onboarding");
    } catch (err) {
      setError("Couldn't log in. Check your username and password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-[420px] mx-auto px-6 min-h-screen flex flex-col justify-center py-16">
      <h1 className="font-serif text-[26px] mb-1 font-medium">Welcome back</h1>
      <p className="text-fg-dim text-[14px] mb-7">Your twin has been waiting.</p>
      {error && <div className="bg-warn/10 border border-warn text-[#E4A7AA] px-3.5 py-3 rounded-sm text-[13px] mb-4">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="field"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          className="field"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="text-fg-faint text-[13px] mt-5">
        New to TWIN?{" "}
        <span className="text-twin cursor-pointer" onClick={() => navigate("/register")}>
          Create an account
        </span>
      </p>
    </div>
  );
}
