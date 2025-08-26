import { createClient } from 'redis';
import WebSocket, { WebSocketServer } from 'ws';

// Initialize Redis subscriber
const redisSubscriber = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379"
});

await redisSubscriber.connect();

redisSubscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));

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

// Subscribe to Redis 'trades' channel and broadcast to WebSocket clients
await redisSubscriber.subscribe('trades', (message) => {
  // ✅ Log the incoming trade message
  console.log('📩 Incoming trade message from Redis:', message);

  // Broadcast to all connected WebSocket clients
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
});
