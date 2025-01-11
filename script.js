document.addEventListener('DOMContentLoaded', () => {
    const connectBtn = document.getElementById('connectBtn');
    const publishBtn = document.getElementById('publishBtn');
    const subscribeBtn = document.getElementById('subscribeBtn');
    const statusSpan = document.getElementById('status');
    const messagesDiv = document.getElementById('messages');
    
    let client = null;

    // Connect to MQTT Broker
    connectBtn.addEventListener('click', () => {
        const broker = document.getElementById('broker').value.trim();
        const port = parseInt(document.getElementById('port').value);
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!broker || !port) {
            alert('Please enter both broker address and port.');
            return;
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

        client = mqtt.connect(wsUrl, options);

        client.on('connect', () => {
            statusSpan.textContent = 'Connected';
            statusSpan.style.color = 'green';
            publishBtn.disabled = false;
            subscribeBtn.disabled = false;
            console.log('Connected to MQTT broker');
        });

        client.on('error', (err) => {
            console.error('Connection error: ', err);
            statusSpan.textContent = 'Connection Error';
            statusSpan.style.color = 'red';
            client.end();
        });

        client.on('reconnect', () => {
            statusSpan.textContent = 'Reconnecting...';
            statusSpan.style.color = 'orange';
        });

        client.on('message', (topic, message) => {
            const msg = document.createElement('p');
            msg.textContent = `[${topic}] ${message.toString()}`;
            messagesDiv.appendChild(msg);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });
    });

    // Publish Message
    publishBtn.addEventListener('click', () => {
        const topic = document.getElementById('topic').value.trim();
        const message = document.getElementById('message').value.trim();

        if (!topic) {
            alert('Please enter a topic to publish to.');
            return;
        }

        client.publish(topic, message, { qos: 1 }, (err) => {
            if (err) {
                console.error('Publish error: ', err);
                alert('Failed to publish message.');
            } else {
                alert('Message published successfully.');
            }
        });
    });

    // Subscribe to Topic
    subscribeBtn.addEventListener('click', () => {
        const subTopic = document.getElementById('subTopic').value.trim();

        if (!subTopic) {
            alert('Please enter a topic to subscribe to.');
            return;
        }

        client.subscribe(subTopic, { qos: 1 }, (err) => {
            if (err) {
                console.error('Subscribe error: ', err);
                alert('Failed to subscribe to topic.');
            } else {
                alert(`Subscribed to topic: ${subTopic}`);
            }
        });
    });
});
