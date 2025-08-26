// apps/price-poller/index.ts
import { WebSocket } from 'ws';
import { markets } from '@repo/constants/markets';

// Interface of the Binance trade 
interface BinanceTrade {
  e: "trade";
  E: number;     // Event time
  s: string;     // Symbol
  t: number;     // Trade ID
  p: string;     // Price
  q: string;     // Quantity
  T: number;     // Trade time
  m: boolean;    // Is buyer the market maker?
  M: boolean;    // Ignore
}

// In-memory trade queues
const tradeQueues: Record<string, BinanceTrade[]> = {};

// Initialize empty queues for each market
markets.forEach((market) => {
  tradeQueues[market.toUpperCase()] = [];

  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${market}@trade`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data.toString());

    // Convert the symbol to uppercase to match the queue key
    const symbol = data.s.toUpperCase();

    // Push trade into buffer
    if (tradeQueues[symbol]) {
      tradeQueues[symbol].push(data);
    }

    console.log(`Trade Data for ${symbol}:`, data);
  };

  ws.onopen = () => {
    console.log(`Connected to market ${market}`);
  };

  ws.onerror = (err) => {
    console.error(`WebSocket error for ${market}:`, err);
  };
});

// Batch upload function (mock)
async function uploadToDatabase(trades: Record<string, BinanceTrade[]>) {
  for (const [symbol, tradeList] of Object.entries(trades)) {
    if (tradeList.length > 0) {
      console.log(`Uploading ${tradeList.length} trades for ${symbol}...`);

      // Replace with your real DB logic here
      await fakeDBInsert(symbol, tradeList);

      // Clear the queue after upload
      tradeQueues[symbol] = [];
    }
  }
}

// Mock DB insert
async function fakeDBInsert(symbol: string, trades: BinanceTrade[]) {
  // Simulate delay
  return new Promise((resolve) => setTimeout(resolve, 100));
}

// Interval to flush trades every 20 seconds
setInterval(() => {
  console.log("\n--- Queue Preview ---");
  for (const [symbol, trades] of Object.entries(tradeQueues)) {
    if (trades.length > 0) {
      console.log(`${symbol} (${trades.length} trades):`, trades.slice(0, 2));
    }
  }

  uploadToDatabase(tradeQueues).catch(console.error);
}, 20_000);
