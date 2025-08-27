'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Optional: filter only candle messages
      if (data?.open && data?.close && data?.high && data?.low) {
        console.log('📊 New Candle:', data);
      }
    };

    ws.onerror = (err) => {
      console.error('❌ WebSocket error:', err);
    };

    ws.onclose = () => {
      console.warn('🔌 WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  return null; // 👈 No UI rendered
}
