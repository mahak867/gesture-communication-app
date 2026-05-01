import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy & DPA — GestureTalk",
  description: "How GestureTalk processes data and our HIPAA/DPDP compliance commitment.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 text-gray-200 bg-gray-950 min-h-screen">
      <a href="/" className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-2 mb-8">
        ← Back to GestureTalk
      </a>

      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy & Data Processing Agreement</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: {new Date().toLocaleDateString("en-IN")}</p>

      <div className="space-y-8 text-sm leading-relaxed">

        <section className="bg-green-900/20 border border-green-700/40 rounded-xl p-5">
          <h2 className="text-green-400 font-bold text-base mb-2">✅ Our Core Promise</h2>
          <p className="text-green-200">
            <strong>No data leaves your device.</strong> GestureTalk processes everything — camera, gestures,
            AI inference, conversation logs — entirely on-device. We do not operate servers that receive
            patient data. We do not sell, share, or monetise any user data.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-3">1. Data We Process</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-800">
                <th className="text-left px-3 py-2 text-gray-300">Data Type</th>
                <th className="text-left px-3 py-2 text-gray-300">Location</th>
                <th className="text-left px-3 py-2 text-gray-300">Retention</th>
                <th className="text-left px-3 py-2 text-gray-300">Shared?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {[
                ["Camera feed", "On-device RAM only", "Never stored", "Never"],
                ["Hand landmarks (21 points)", "On-device RAM", "Never stored", "Never"],
                ["Conversation log", "localStorage", "Until cleared", "Never"],
                ["Gesture statistics", "localStorage", "Until cleared", "Never"],
                ["Phrase packs / custom phrases", "localStorage", "Until cleared", "Never"],
                ["Audit log", "localStorage", "Until cleared", "Never"],
                ["AI inference (Gemma 4)", "Localhost Ollama", "Not retained", "Never"],
                ["Analytics events", "localStorage", "Until cleared", "Never"],
              ].map(([type, loc, ret, shared]) => (
                <tr key={type} className="bg-gray-900/40">
                  <td className="px-3 py-2 text-gray-200">{type}</td>
                  <td className="px-3 py-2 text-gray-400">{loc}</td>
                  <td className="px-3 py-2 text-gray-400">{ret}</td>
                  <td className={`px-3 py-2 font-bold ${shared === "Never" ? "text-green-400" : "text-yellow-400"}`}>{shared}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-3">2. HIPAA Compliance</h2>
          <p className="text-gray-300 mb-2">
            GestureTalk is designed as a HIPAA-compatible communication tool. Because Protected Health Information
            (PHI) never leaves the patient&apos;s device and is never transmitted to our servers, GestureTalk does not
            act as a Business Associate under 45 CFR 164. No BAA is required for the on-device app.
          </p>
          <p className="text-gray-400 text-xs">
            Note: If your institution operates the caregiver dashboard on a hospital-managed server, a BAA may
            apply to that deployment. Contact your data protection officer.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-3">3. India DPDP Act, 2023</h2>
          <p className="text-gray-300 mb-2">
            Under the Digital Personal Data Protection Act, 2023 (DPDP), GestureTalk:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-1 ml-2">
            <li>Processes no personal data on our infrastructure — all processing is local.</li>
            <li>Does not transfer data outside India (no servers receive data at all).</li>
            <li>Provides complete data erasure via the &quot;Clear All Data&quot; option in Settings.</li>
            <li>Requires no consent beyond camera permission, which is managed by the browser.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-3">4. Camera &amp; Microphone</h2>
          <p className="text-gray-300">
            The camera is used exclusively for hand gesture detection via MediaPipe, running entirely in-browser.
            No video frames are stored or transmitted. The microphone is not used. Speech output uses the
            browser&apos;s built-in Web Speech API, which may route through the device&apos;s OS-level TTS engine.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-3">5. AI / Gemma 4</h2>
          <p className="text-gray-300">
            When the Gemma 4 AI model is enabled, it runs via Ollama on the same device (localhost:11434).
            No prompts or completions are transmitted to Anthropic, Google, or any third party.
            If Ollama is not running, GestureTalk falls back to local rule-based suggestion with no network call.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-3">6. Your Rights</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-1 ml-2">
            <li><strong>Access:</strong> All data is in your browser&apos;s localStorage — open DevTools to inspect.</li>
            <li><strong>Erasure:</strong> Settings → Clear All Data removes all locally stored data instantly.</li>
            <li><strong>Portability:</strong> Export your conversation log from the Conversation Log tab.</li>
            <li><strong>Correction:</strong> Edit custom phrases directly in the Phrases tab.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-3">7. Contact</h2>
          <p className="text-gray-300">
            For privacy enquiries: <a href="mailto:privacy@gesturetalk.app" className="text-cyan-400 underline">privacy@gesturetalk.app</a>
          </p>
        </section>
      </div>
    </main>
  );
}
