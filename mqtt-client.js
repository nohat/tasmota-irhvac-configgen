export class MQTTClient {
    constructor() {
        this.client = null;
        this.statusSpan = document.getElementById('status');
        this.publishBtn = document.getElementById('publishBtn');
        this.subscribeBtn = document.getElementById('subscribeBtn');
        this.messagesDiv = document.getElementById('messages');
    }

    async connect(broker, port, username, password) {
        if (!broker || !port) {
            throw new Error('Please enter both broker address and port.');
        }

        const options = {
            connectTimeout: 4000,
            clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
            username: username || undefined,
            password: password || undefined,
            keepalive: 60,
            clean: true,
            reconnectPeriod: 1000,
        };

        const wsUrl = `wss://${broker}:${port}`;
        
        return new Promise((resolve, reject) => {
            this.client = mqtt.connect(wsUrl, options);

            this.client.once('connect', () => {
                this.statusSpan.textContent = 'Connected';
                this.statusSpan.style.color = 'green';
                this.publishBtn.disabled = false;
                this.subscribeBtn.disabled = false;
                console.log('Connected to MQTT broker');
                resolve();
            });

            this.client.once('error', (err) => {
                console.error('Connection error: ', err);
                this.statusSpan.textContent = 'Connection Error';
                this.statusSpan.style.color = 'red';
                this.client.end();
                reject(err);
            });

            // Set up ongoing event handlers
            this.client.on('reconnect', () => {
                this.statusSpan.textContent = 'Reconnecting...';
                this.statusSpan.style.color = 'orange';
            });

            this.client.on('message', (topic, message) => {
                const msg = document.createElement('p');
                msg.textContent = `[${topic}] ${message.toString()}`;
                this.messagesDiv.appendChild(msg);
                this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
            });
        });
    }

    async publish(topic, message, options = { qos: 1 }) {
        if (!this.client || !this.client.connected) {
            throw new Error('Not connected to MQTT broker.');
        }

        return new Promise((resolve, reject) => {
            this.client.publish(topic, message, options, (err) => {
                if (err) {
                    console.error('Publish error: ', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async subscribe(topic) {
        if (!this.client || !this.client.connected) {
            throw new Error('Not connected to MQTT broker.');
        }

        return new Promise((resolve, reject) => {
            this.client.subscribe(topic, { qos: 1 }, (err) => {
                if (err) {
                    console.error('Subscribe error: ', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    isConnected() {
        return this.client && this.client.connected;
    }
} 