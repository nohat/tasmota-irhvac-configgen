import { generateDiscoveryPayload } from './discovery-payload-generator.js?v={{ site.time | date: "%Y%m%d%H%M%S" }}';

export function convertTemp(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;
    if (fromUnit === 'F' && toUnit === 'C') {
        return Math.round((value - 32) * 5 / 9);
    }
    return Math.round((value * 9 / 5) + 32);
}

export function initializeFormHandlers(editor, mqttClient) {
    const connectBtn = document.getElementById('connectBtn');
    const publishBtn = document.getElementById('publishBtn');
    const subscribeBtn = document.getElementById('subscribeBtn');
    const generateDiscoveryBtn = document.getElementById('generateDiscoveryBtn');
    const publishPayloadBtn = document.getElementById('publishPayloadBtn');
    let currentDiscoveryPayload = null;

    // Temperature unit change handler
    const tempUnit = document.getElementById('tempUnit');
    const minTemp = document.getElementById('minTemp');
    const maxTemp = document.getElementById('maxTemp');

    tempUnit.addEventListener('change', () => {
        const newUnit = tempUnit.value;
        const oldUnit = newUnit === 'F' ? 'C' : 'F';
        
        // Convert min and max temperatures
        minTemp.value = convertTemp(parseFloat(minTemp.value), oldUnit, newUnit);
        maxTemp.value = convertTemp(parseFloat(maxTemp.value), oldUnit, newUnit);

        // Update input constraints
        if (newUnit === 'C') {
            minTemp.min = "0";
            minTemp.max = "40";
            maxTemp.min = "0";
            maxTemp.max = "40";
        } else {
            minTemp.min = "32";
            minTemp.max = "104";
            maxTemp.min = "32";
            maxTemp.max = "104";
        }
    });

    // MQTT Connection handler
    connectBtn.addEventListener('click', () => {
        const broker = document.getElementById('broker').value.trim();
        const port = parseInt(document.getElementById('port').value);
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        mqttClient.connect(broker, port, username, password);
    });

    // Publish message handler
    publishBtn.addEventListener('click', async () => {
        const topic = document.getElementById('topic').value.trim();
        const message = document.getElementById('message').value.trim();

        if (!topic) {
            alert('Please enter a topic to publish to.');
            return;
        }

        try {
            await mqttClient.publish(topic, message);
            alert('Message published successfully.');
        } catch (err) {
            alert('Failed to publish message.');
        }
    });

    // Subscribe handler
    subscribeBtn.addEventListener('click', async () => {
        const subTopic = document.getElementById('subTopic').value.trim();

        if (!subTopic) {
            alert('Please enter a topic to subscribe to.');
            return;
        }

        try {
            await mqttClient.subscribe(subTopic);
            alert(`Subscribed to topic: ${subTopic}`);
        } catch (err) {
            alert('Failed to subscribe to topic.');
        }
    });

    // Generate discovery payload handler
    generateDiscoveryBtn.addEventListener('click', () => {
        const entityId = document.getElementById('entityId').value.trim();
        const tasmotaId = document.getElementById('deviceId').value.trim();
        const irhvacVendor = document.getElementById('irhvacVendor').value.trim();
        const configUrl = document.getElementById('configUrl').value.trim();
        const manufacturer = document.getElementById('manufacturer').value.trim();
        const model = document.getElementById('model').value.trim();
        const suggestedArea = document.getElementById('suggestedArea').value.trim();
        const serialNumber = document.getElementById('serialNumber').value.trim();

        // Get operational settings
        const tempUnit = document.getElementById('tempUnit').value;
        const tempStep = parseFloat(document.getElementById('tempStep').value);
        const minTemp = parseInt(document.getElementById('minTemp').value);
        const maxTemp = parseInt(document.getElementById('maxTemp').value);
        
        // Get selected modes
        const modes = Array.from(document.querySelectorAll('input[name="modes"]:checked'))
            .map(input => input.value);
        const fanModes = Array.from(document.querySelectorAll('input[name="fanModes"]:checked'))
            .map(input => input.value);
        const swingModes = Array.from(document.querySelectorAll('input[name="swingModes"]:checked'))
            .map(input => input.value);

        // Validate all required fields
        const requiredFields = {
            'Entity ID': entityId,
            'Tasmota Device ID': tasmotaId,
            'IRHVAC Vendor': irhvacVendor,
            'Configuration URL': configUrl,
            'Manufacturer': manufacturer,
            'Model': model,
            'Suggested Area': suggestedArea,
            'Serial Number': serialNumber,
            'Operation Modes': modes.length > 0,
            'Fan Modes': fanModes.length > 0,
            'Swing Modes': swingModes.length > 0
        };

        const emptyFields = Object.entries(requiredFields)
            .filter(([_, value]) => !value)
            .map(([name, _]) => name);

        if (emptyFields.length > 0) {
            alert(`Please fill in the following required fields:\n${emptyFields.join('\n')}`);
            return;
        }

        currentDiscoveryPayload = generateDiscoveryPayload({
            device: {
                tasmotaId,
                irhvacVendor,
                manufacturer,
                model,
                serialNumber,
                configUrl
            },
            config: {
                entityId,
                suggestedArea,
                tempUnit,
                tempStep,
                minTemp,
                maxTemp,
                modes,
                fanModes,
                swingModes
            }
        });
        editor.setValue(JSON.stringify(currentDiscoveryPayload, null, 2), -1);
        publishPayloadBtn.disabled = !mqttClient.isConnected();
    });

    // Publish discovery payload handler
    publishPayloadBtn.addEventListener('click', async () => {
        if (!currentDiscoveryPayload) {
            alert('Please generate the discovery payload first.');
            return;
        }

        const entityId = document.getElementById('entityId').value.trim();
        const discoveryTopic = `homeassistant/device/${entityId}/config`;

        try {
            await mqttClient.publish(discoveryTopic, JSON.stringify(currentDiscoveryPayload), { qos: 2, retain: true });
            alert('Discovery payload published successfully.');
        } catch (err) {
            alert('Failed to publish discovery payload.');
        }
    });
} 