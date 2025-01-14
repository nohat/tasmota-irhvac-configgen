import { generateDiscoveryPayload } from './discovery-payload-generator.js?v={{ site.time | date: "%Y%m%d%H%M%S" }}';

function saveFormState() {
    const formData = {
        // Device Information
        deviceId: document.getElementById('deviceId').value,
        irhvacVendor: document.getElementById('irhvacVendor').value,
        manufacturer: document.getElementById('manufacturer').value,
        model: document.getElementById('model').value,
        serialNumber: document.getElementById('serialNumber').value,
        configUrl: document.getElementById('configUrl').value,
        
        // HA Configuration
        entityId: document.getElementById('entityId').value,
        suggestedArea: document.getElementById('suggestedArea').value,
        
        // Operational Settings
        tempUnit: document.getElementById('tempUnit').value,
        tempStep: document.getElementById('tempStep').value,
        minTemp: document.getElementById('minTemp').value,
        maxTemp: document.getElementById('maxTemp').value,
        
        // Modes
        modes: Array.from(document.querySelectorAll('input[name="modes"]:checked')).map(input => input.value),
        fanModes: Array.from(document.querySelectorAll('input[name="fanModes"]:checked')).map(input => input.value),
        swingModes: Array.from(document.querySelectorAll('input[name="swingModes"]:checked')).map(input => input.value),
        
        // MQTT Settings
        broker: document.getElementById('broker').value,
        port: document.getElementById('port').value,
        username: document.getElementById('username').value
        // We don't save password for security reasons
    };
    
    localStorage.setItem('formState', JSON.stringify(formData));
}

function restoreFormState() {
    const savedState = localStorage.getItem('formState');
    if (!savedState) return;
    
    try {
        const formData = JSON.parse(savedState);
        
        // Restore text and number inputs
        Object.entries(formData).forEach(([key, value]) => {
            if (Array.isArray(value)) return; // Skip arrays (handled below)
            const element = document.getElementById(key);
            if (element) element.value = value;
        });
        
        // Restore checkboxes
        ['modes', 'fanModes', 'swingModes'].forEach(modeType => {
            if (!formData[modeType]) return;
            document.querySelectorAll(`input[name="${modeType}"]`).forEach(checkbox => {
                checkbox.checked = formData[modeType].includes(checkbox.value);
            });
        });
        
    } catch (err) {
        console.error('Failed to restore form state:', err);
        localStorage.removeItem('formState'); // Clear invalid state
    }
}

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
    const publishPayloadBtn = document.getElementById('publishPayloadBtn');
    let currentDiscoveryPayload = null;

    function updateDiscoveryPayload() {
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

        try {
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
            
            // Save form state after successful payload generation
            saveFormState();
        } catch (err) {
            console.error('Failed to generate discovery payload:', err);
        }
    }

    // Add change listeners to all form inputs
    const formInputs = document.querySelectorAll('input, select');
    formInputs.forEach(input => {
        input.addEventListener('change', () => {
            updateDiscoveryPayload();
            saveFormState();
        });
        if (input.type === 'text' || input.type === 'number') {
            input.addEventListener('input', () => {
                updateDiscoveryPayload();
                saveFormState();
            });
        }
    });

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

        // Update the discovery payload with the new temperature values
        updateDiscoveryPayload();
    });

    // MQTT Connection handler
    connectBtn.addEventListener('click', async () => {
        try {
            const broker = document.getElementById('broker').value.trim();
            const port = parseInt(document.getElementById('port').value);
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            await mqttClient.connect(broker, port, username, password);
            publishPayloadBtn.disabled = !mqttClient.isConnected();
        } catch (err) {
            alert(err.message);
        }
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
            alert(err.message);
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
            alert(err.message);
        }
    });

    // Publish discovery payload handler
    publishPayloadBtn.addEventListener('click', async () => {
        if (!currentDiscoveryPayload) {
            alert('Please fill in the required form fields first.');
            return;
        }

        const entityId = document.getElementById('entityId').value.trim();
        const discoveryTopic = `homeassistant/device/${entityId}/config`;

        try {
            await mqttClient.publish(discoveryTopic, JSON.stringify(currentDiscoveryPayload), { qos: 2, retain: true });
            alert('Discovery payload published successfully.');
        } catch (err) {
            alert(`Failed to publish discovery payload: ${err.message}`);
        }
    });

    // Restore form state on initialization
    restoreFormState();
    // Generate initial payload after state restoration
    updateDiscoveryPayload();
} 