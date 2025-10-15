import SockJS from 'sockjs-client/dist/sockjs';
import * as Stomp from 'webstomp-client';

// Simple singleton STOMP manager for one connection, multi-subscriptions
class StompManager {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.subscriptions = new Map(); // key -> unsubscribe fn
        this.connectingPromise = null;
        this._listeners = { connect: new Set(), close: new Set(), error: new Set() };
        this._sock = null;
    }

    async connect() {
        if (this.connected && this.stompClient) return this.stompClient;
        if (this.connectingPromise) return this.connectingPromise;

        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const sockJs = new SockJS(`${baseURL}/chat-service/connect`);
        this._sock = sockJs;
        // Detect close/error
        sockJs.onclose = (evt) => {
            this.connected = false;
            this._emit('close', evt);
        };
        sockJs.onerror = (evt) => {
            this._emit('error', evt);
        };
        this.stompClient = Stomp.over(sockJs);
        const accessToken = localStorage.getItem('accessToken');

        this.connectingPromise = new Promise((resolve, reject) => {
            try {
                this.stompClient.connect(
                    { Authorization: `Bearer ${accessToken}` },
                    () => {
                        this.connected = true;
                        // Hook into underlying websocket close/error AFTER STOMP has attached its handlers
                        try {
                            const ws = this.stompClient.ws || this._sock;
                            if (ws) {
                                const prevOnClose = ws.onclose;
                                ws.onclose = (evt) => {
                                    try { if (prevOnClose) prevOnClose(evt); } catch (_) {}
                                    this.connected = false;
                                    this._emit('close', evt);
                                };
                                const prevOnError = ws.onerror;
                                ws.onerror = (evt) => {
                                    try { if (prevOnError) prevOnError(evt); } catch (_) {}
                                    this._emit('error', evt);
                                };
                            }
                        } catch (_) {}
                        this._emit('connect');
                        resolve(this.stompClient);
                    },
                    (error) => {
                        this.connected = false;
                        this.connectingPromise = null;
                        this._emit('error', error);
                        reject(error);
                    }
                );
            } catch (e) {
                this.connected = false;
                this.connectingPromise = null;
                this._emit('error', e);
                reject(e);
            }
        });

        try {
            await this.connectingPromise;
        } finally {
            // keep promise for concurrent callers until resolved/rejected, then next calls can create new
            this.connectingPromise = null;
        }

        return this.stompClient;
    }

    async ensureConnected() {
        if (!this.connected || !this.stompClient) {
            await this.connect();
        }
        return this.stompClient;
    }

    async subscribe(topic, callback, headers = {}) {
        await this.ensureConnected();
        const key = topic;
        // idempotent: if exists, unsubscribe first then resubscribe
        this.unsubscribe(topic);
        const accessToken = localStorage.getItem('accessToken');
        const sub = this.stompClient.subscribe(
            topic,
            (message) => {
                try {
                    const parsed = JSON.parse(message.body);
                    callback(parsed);
                } catch (_) {
                    callback(message.body);
                }
            },
            { Authorization: `Bearer ${accessToken}`, ...headers }
        );
        const disposer = () => {
            try { sub.unsubscribe(); } catch (_) {}
            this.subscriptions.delete(key);
        };
        this.subscriptions.set(key, disposer);
        // Return a callable disposer that also exposes an unsubscribe() method
        const callable = () => this.unsubscribe(topic);
        callable.unsubscribe = callable;
        return callable;
    }

    async send(destination, body, headers = {}) {
        const client = await this.ensureConnected();
        const accessToken = localStorage.getItem('accessToken');
        client.send(destination, body, { Authorization: `Bearer ${accessToken}`, ...headers });
    }

    unsubscribe(topic) {
        const key = topic;
        const disposer = this.subscriptions.get(key);
        if (disposer) {
            disposer();
        }
    }

    disconnect() {
        // keep for app-wide teardown
        try {
            for (const disposer of this.subscriptions.values()) {
                try { disposer(); } catch (_) {}
            }
            this.subscriptions.clear();
            if (this.stompClient && this.connected) {
                this.stompClient.disconnect();
            }
        } finally {
            this.stompClient = null;
            this.connected = false;
        }
    }

    on(event, listener) {
        const set = this._listeners[event];
        if (set) set.add(listener);
        return () => this.off(event, listener);
    }

    off(event, listener) {
        const set = this._listeners[event];
        if (set) set.delete(listener);
    }

    _emit(event, payload) {
        const set = this._listeners[event];
        if (!set) return;
        for (const cb of Array.from(set)) {
            try { cb(payload); } catch (_) {}
        }
    }
}

const stompManager = new StompManager();
export default stompManager;


