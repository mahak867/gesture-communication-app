'use client';
// Auto-redirects to main app with ?demo=1 — judges use this URL
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/?demo=1');
  }, [router]);
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-t-cyan-400 border-gray-700 rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Starting GestureTalk demo mode...</p>
    </div>
  );
}
