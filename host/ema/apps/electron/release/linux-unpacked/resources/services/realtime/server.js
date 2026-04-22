import { WebSocketServer } from 'ws';
import { getServer } from '../http/server.js';
let wss;
let pubsub;
const clients = new WeakMap();
const channelHandlers = new Map();
export function registerChannelHandler(topicPattern, handler) {
    channelHandlers.set(topicPattern, handler);
}
function findHandler(topic) {
    if (channelHandlers.has(topic))
        return channelHandlers.get(topic);
    for (const [pattern, handler] of channelHandlers) {
        if (pattern.endsWith(':*') && topic.startsWith(pattern.slice(0, -1)))
            return handler;
    }
    return undefined;
}
function sendMessage(ws, msg) {
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(msg));
    }
}
function handleMessage(ws, raw) {
    let msg;
    try {
        msg = JSON.parse(raw);
    }
    catch {
        return;
    }
    if (!Array.isArray(msg) || msg.length !== 5)
        return;
    const [joinRef, ref, topic, event, payload] = msg;
    const state = clients.get(ws);
    if (!state)
        return;
    const reply = (response) => {
        sendMessage(ws, [joinRef, ref, topic, 'phx_reply', { status: 'ok', response }]);
    };
    switch (event) {
        case 'heartbeat': {
            sendMessage(ws, [null, ref, 'phoenix', 'phx_reply', { status: 'ok', response: {} }]);
            return;
        }
        case 'phx_join': {
            const handler = findHandler(topic);
            if (!handler) {
                sendMessage(ws, [joinRef, ref, topic, 'phx_reply', { status: 'error', response: { error: 'no_handler' } }]);
                return;
            }
            const callback = (evt, pl) => {
                sendMessage(ws, [null, null, topic, evt, pl]);
            };
            state.joinedTopics.set(topic, callback);
            pubsub?.subscribe(topic, callback);
            handler(topic, 'phx_join', payload, reply);
            return;
        }
        case 'phx_leave': {
            const cb = state.joinedTopics.get(topic);
            if (cb) {
                pubsub?.unsubscribe(topic, cb);
                state.joinedTopics.delete(topic);
            }
            reply({});
            return;
        }
        default: {
            const handler = findHandler(topic);
            if (handler) {
                handler(topic, event, payload, reply);
            }
            else {
                reply({ error: 'no_handler' });
            }
        }
    }
}
function cleanupClient(ws) {
    const state = clients.get(ws);
    if (!state)
        return;
    for (const [topic, cb] of state.joinedTopics) {
        pubsub?.unsubscribe(topic, cb);
    }
    state.joinedTopics.clear();
    clients.delete(ws);
}
export function startWsServer(ps) {
    pubsub = ps;
    const httpServer = getServer()?.server;
    if (!httpServer)
        throw new Error('HTTP server must be started before WebSocket server');
    wss = new WebSocketServer({ server: httpServer, path: '/socket/websocket' });
    wss.on('connection', (ws, _req) => {
        clients.set(ws, { joinedTopics: new Map() });
        ws.on('message', (data) => {
            handleMessage(ws, data.toString());
        });
        ws.on('close', () => cleanupClient(ws));
        ws.on('error', () => cleanupClient(ws));
    });
}
export function stopWsServer() {
    if (wss) {
        for (const client of wss.clients) {
            client.close();
        }
        wss.close();
        wss = undefined;
    }
}
export function broadcast(topic, event, payload) {
    pubsub?.publish(topic, event, payload);
}
//# sourceMappingURL=server.js.map