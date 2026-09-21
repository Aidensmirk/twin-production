import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const profile = await register(form.username, form.email, form.password);
      navigate(profile.onboarded ? "/home" : "/onboarding");
    } catch (err) {
      const data = err.response?.data;
      if (data?.username?.[0]) {
        setError("That username is already in use. Choose another one.");
      } else if (data?.password?.[0]) {
        setError(data.password[0]);
      } else {
        setError("Registration failed. Check your details and try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-[420px] mx-auto px-6 min-h-screen flex flex-col justify-center py-16">
      <h1 className="font-serif text-[26px] mb-1 font-medium">Create your twin</h1>
      <p className="text-fg-dim text-[14px] mb-7">It starts knowing nothing about you.</p>
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
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
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
          {busy ? "Creating…" : "Begin"}
        </button>
      </form>
      <p className="text-fg-faint text-[13px] mt-5">
        Already have a twin?{" "}
        <span className="text-twin cursor-pointer" onClick={() => navigate("/login")}>
          Log in
        </span>
      </p>
    </div>
  );
}
