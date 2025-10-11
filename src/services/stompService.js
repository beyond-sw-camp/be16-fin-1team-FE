import SockJS from 'sockjs-client/dist/sockjs';
import * as Stomp from 'webstomp-client';

// Simple singleton STOMP manager for one connection, multi-subscriptions
class StompManager {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.subscriptions = new Map(); // key -> unsubscribe fn
        this.connectingPromise = null;
    }

    async connect() {
        if (this.connected && this.stompClient) return this.stompClient;
        if (this.connectingPromise) return this.connectingPromise;

        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const sockJs = new SockJS(`${baseURL}/chat-service/connect`);
        this.stompClient = Stomp.over(sockJs);
        const accessToken = localStorage.getItem('accessToken');

        this.connectingPromise = new Promise((resolve, reject) => {
            try {
                this.stompClient.connect(
                    { Authorization: `Bearer ${accessToken}` },
                    () => {
                        this.connected = true;
                        resolve(this.stompClient);
                    },
                    (error) => {
                        this.connected = false;
                        this.connectingPromise = null;
                        reject(error);
                    }
                );
            } catch (e) {
                this.connected = false;
                this.connectingPromise = null;
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
        this.subscriptions.set(key, () => {
            try { sub.unsubscribe(); } catch (_) {}
            this.subscriptions.delete(key);
        });
        return () => this.unsubscribe(topic);
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
}

const stompManager = new StompManager();
export default stompManager;


