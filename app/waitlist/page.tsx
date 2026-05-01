"use client";
import { useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "gesturetalk-waitlist";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [hospital, setHospital] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submit = () => {
    if (!email.includes("@")) { setError("Please enter a valid email address."); return; }
    if (!role) { setError("Please select your role."); return; }
    setError("");
    const entry = { email, role, hospital, ts: new Date().toISOString() };
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, entry]));
    } catch { /* ignore */ }
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-12">
      <Link href="/" className="text-cyan-400 hover:text-cyan-300 text-sm self-start mb-8">← Back to app</Link>

      {/* Hero */}
      <div className="text-center space-y-4 max-w-xl mb-12">
        <div className="text-6xl">🤟</div>
        <h1 className="text-3xl font-bold">GestureTalk</h1>
        <p className="text-xl text-cyan-400 font-semibold">
          Communication for every voice — even without words.
        </p>
        <p className="text-gray-400">
          An AAC device in your pocket. Real-time gesture recognition, on-device Gemma AI,
          and 7 phrase packs built for Indian hospitals.
        </p>
      </div>

      {/* Social proof */}
      <div className="flex flex-wrap justify-center gap-4 mb-10 text-xs text-gray-400">
        {["100% on-device", "HIPAA + DPDP ready", "Works offline", "Free for NGOs", "ISL support"].map(tag => (
          <span key={tag} className="bg-gray-800 border border-gray-700 px-3 py-1 rounded-full">{tag}</span>
        ))}
      </div>

      {/* Form */}
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-bold text-white">You&apos;re on the list!</h2>
            <p className="text-gray-400 text-sm">
              We&apos;ll reach out at <span className="text-cyan-400">{email}</span> when GestureTalk Pro launches.
            </p>
            <Link href="/" className="block w-full text-center bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-3 rounded-xl transition-colors">
              Try the app now →
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold">Join the waitlist</h2>
            <p className="text-xs text-gray-400">No spam. We email only when we launch.</p>

            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-600"
                aria-label="Email address"
              />

              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-600"
                aria-label="Your role"
              >
                <option value="">Your role…</option>
                <option value="patient">Patient / User</option>
                <option value="caregiver">Caregiver / Family</option>
                <option value="slp">Speech-Language Pathologist</option>
                <option value="nurse">Nurse / Doctor</option>
                <option value="hospital_admin">Hospital Administrator</option>
                <option value="ngo">NGO / Non-profit</option>
                <option value="developer">Developer</option>
                <option value="investor">Investor</option>
              </select>

              <input
                type="text"
                value={hospital}
                onChange={e => setHospital(e.target.value)}
                placeholder="Hospital or organisation (optional)"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-600"
                aria-label="Hospital or organisation"
              />

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button
                onClick={submit}
                className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-3.5 rounded-xl text-sm transition-colors min-h-[52px]"
              >
                Join waitlist →
              </button>
            </div>

            <p className="text-xs text-gray-600 text-center">
              By signing up you agree to our{" "}
              <a href="/privacy" className="text-cyan-600 underline">Privacy Policy</a>.
              Your email is stored locally until we build a backend.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
