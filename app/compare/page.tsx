import Link from 'next/link';

const rows = [
  { feature:'Who it helps',       gt:'Mute patients — directly in their hands',   mediflow:'Hospital admin staff',        aac:'Mute patients — if they can afford it' },
  { feature:'Price',              gt:'₹0 — free forever',                          mediflow:'SaaS subscription',           aac:'₹80,000–₹12,00,000' },
  { feature:'Works offline',      gt:'✅ Yes — full offline via service worker',    mediflow:'❌ Cloud-dependent',           aac:'✅ Yes (device-based)' },
  { feature:'On-device AI',       gt:'✅ Gemma 4 via Ollama — nothing leaves phone',mediflow:'❌ Cloud API calls',           aac:'✅ (proprietary models)' },
  { feature:'Indian languages',   gt:'✅ 6 — Hindi/Tamil/Telugu/Bengali/Marathi/Punjabi',mediflow:'❌ English only visible',  aac:'⚠️ English only or paid add-on' },
  { feature:'ISL support',        gt:'✅ Indian Sign Language phrase packs',         mediflow:'❌',                          aac:'❌ ISL not supported' },
  { feature:'Hardware input',     gt:'✅ BLE wristband + flex sensor glove',        mediflow:'❌',                          aac:'⚠️ Eye gaze only (very expensive)' },
  { feature:'Works for late ALS', gt:'✅ Wristband tilt — minimal movement needed', mediflow:'❌ Not patient-facing',        aac:'✅ With €20K+ eye gaze unit' },
  { feature:'Emergency SOS',      gt:'✅ One gesture → alarm + caregiver alert',    mediflow:'❌',                          aac:'⚠️ On some models' },
  { feature:'FHIR R4 export',     gt:'✅ Epic/Cerner compatible bundles',           mediflow:'✅ (clinical focus)',          aac:'❌' },
  { feature:'SOAP notes',         gt:'✅ Gemma 4 auto-generates from session',      mediflow:'✅ (core feature)',            aac:'❌' },
  { feature:'Setup time',         gt:'5 minutes on existing phone',                mediflow:'Hospital IT integration',     aac:'2–4 week procurement + training' },
  { feature:'Gemma 4 use cases',  gt:'6 — vision, text, translate, emotion, function calling, SOAP',mediflow:'2-3 — text generation',aac:'N/A' },
  { feature:'Open source',        gt:'✅ MIT license',                              mediflow:'❌',                          aac:'❌ Proprietary' },
];

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-900">
        <Link href="/" className="text-lg font-bold">🤟 GestureTalk</Link>
        <Link href="/" className="text-sm text-cyan-500">← Open app</Link>
      </nav>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <p className="text-sm text-cyan-500 font-medium uppercase tracking-widest mb-3">Comparison</p>
        <h1 className="text-3xl font-bold mb-2">GestureTalk vs the alternatives</h1>
        <p className="text-gray-400 mb-8">Why GestureTalk is the only solution that works for every mute patient in India — regardless of income, literacy, or condition severity.</p>
        <div className="overflow-x-auto rounded-2xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/60">
                <th className="text-left px-4 py-3 text-gray-400 font-medium w-40">Feature</th>
                <th className="text-left px-4 py-3 text-cyan-400 font-bold">GestureTalk ✦</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">MediFlow AI</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Traditional AAC</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.feature} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/20'}>
                  <td className="px-4 py-3 text-gray-500 font-medium text-xs">{r.feature}</td>
                  <td className="px-4 py-3 text-gray-200">{r.gt}</td>
                  <td className="px-4 py-3 text-gray-500">{r.mediflow}</td>
                  <td className="px-4 py-3 text-gray-500">{r.aac}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 bg-cyan-950/30 border border-cyan-800/50 rounded-2xl p-6">
          <h2 className="font-bold text-cyan-300 mb-2">The key difference</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            MediFlow AI automates paperwork for hospital staff. GestureTalk gives mute patients a voice. These serve different users. A hospital could deploy both — but if you had to choose one that changes a patient&apos;s life directly, it is the tool that lets a person with ALS tell their nurse they cannot breathe.
          </p>
        </div>
        <div className="mt-4 flex gap-3 flex-wrap">
          <Link href="/?demo=1" className="bg-cyan-700 hover:bg-cyan-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">Try the demo →</Link>
          <Link href="/casestudy" className="border border-gray-700 hover:border-gray-500 text-gray-300 px-6 py-3 rounded-xl text-sm transition-colors">Read the case study</Link>
        </div>
      </div>
    </div>
  );
}
