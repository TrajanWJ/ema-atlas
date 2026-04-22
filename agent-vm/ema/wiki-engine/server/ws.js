const { WebSocketServer } = require('ws');

let wss;
const clients = new Set();

function initWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('[WS] Client error:', err.message);
      clients.delete(ws);
    });

    // Send welcome
    ws.send(JSON.stringify({ type: 'wiki:connected', timestamp: Date.now() }));
  });

  console.log('[WS] WebSocket server initialized');
}

function broadcast(event, data) {
  if (!wss) return;
  const message = JSON.stringify({ type: event, data, timestamp: Date.now() });
  const dead = [];
  for (const client of clients) {
    if (client.readyState === 1) { // OPEN
      try {
        client.send(message);
      } catch (err) {
        dead.push(client);
      }
    } else {
      dead.push(client);
    }
  }
  dead.forEach(c => clients.delete(c));
}

module.exports = { initWebSocket, broadcast };
