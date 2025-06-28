'use client';
import { useEffect, useState } from 'react';

export default function Toast({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-accent text-black px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-semibold animate-fadeIn">
      {message}
    </div>
  );
}
