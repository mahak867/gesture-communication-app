import Link from 'next/link';

export const metadata = { title: 'Privacy – GestureTalk' };

export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl p-6 leading-relaxed">
      <h1 className="mb-4 text-3xl font-bold">Privacy</h1>
      <ul className="list-disc space-y-3 pl-6">
        <li>No account, no tracking, no analytics, no advertising.</li>
        <li>Your settings, message history and learned words are stored only in this browser (localStorage). Clearing site data or using “Delete history” removes them.</li>
        <li>Speech is produced by your device’s built-in voice.</li>
        <li>Sign recognition runs entirely in this browser. Glove data and recorded signs are never uploaded. A backup file is only created when you choose “Back up”.</li>
        <li>The glove connects directly to this device over Bluetooth. Its data never leaves the device.</li>
        <li>AI sentence suggestions are off by default. When turned on, what you type is sent only to the Ollama server configured by whoever runs this app (by default the same computer).</li>
      </ul>
      <p className="mt-6 text-sm opacity-75">
        GestureTalk is a communication aid, not a medical device. It does not replace nurse call systems or clinical monitoring.
      </p>
      <Link href="/" className="mt-6 inline-block underline">← Back</Link>
    </main>
  );
}
