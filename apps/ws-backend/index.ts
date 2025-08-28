// apps/price-subscriber/index.ts
import { createClient } from 'redis';
import WebSocket, { WebSocketServer } from 'ws';

// Initialize Redis subscriber
const redisSubscriber = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379"
});

redisSubscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));

await redisSubscriber.connect();

// Create WebSocket server for frontend clients
const wss = new WebSocketServer({ port: 8080 });

// ✅ Log when server starts
console.log('✅ WebSocket server started on ws://localhost:8080');

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('⚡ Frontend client connected');

  ws.on('close', () => {
    clients.delete(ws);
    console.log('❌ Frontend client disconnected');
  });

  ws.on('error', (err) => {
    console.error('WebSocket Client Error:', err);
  });
});

// Subscribe to multiple Redis channels
await redisSubscriber.subscribe(['candles', 'trades', 'book_ticker'], (message, channel) => {
  const payload = JSON.stringify({
    channel,                 // which channel (candles | trades | book_ticker)
    data: JSON.parse(message) // the actual published data
  });

  // Broadcast to all connected WebSocket clients
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
});
