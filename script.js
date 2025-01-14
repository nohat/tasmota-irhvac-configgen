document.addEventListener('DOMContentLoaded', () => {
    // Initialize Ace Editor
    const editor = ace.edit("discoveryEditor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/json");
    editor.setValue("{\n\t\"example\": \"This is a JSON example\"\n}", -1);
    editor.setOptions({
        maxLines: Infinity,
        minLines: 10,
        autoScrollEditorIntoView: true,
        useWorker: false
    });

    // Temperature conversion handlers
    const tempUnit = document.getElementById('tempUnit');
    const minTemp = document.getElementById('minTemp');
    const maxTemp = document.getElementById('maxTemp');

    function convertTemp(value, fromUnit, toUnit) {
        if (fromUnit === toUnit) return value;
        if (fromUnit === 'F' && toUnit === 'C') {
            return Math.round((value - 32) * 5 / 9);
        }
        return Math.round((value * 9 / 5) + 32);
    }

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

    const connectBtn = document.getElementById('connectBtn');
    const publishBtn = document.getElementById('publishBtn');
    const subscribeBtn = document.getElementById('subscribeBtn');
    const statusSpan = document.getElementById('status');
    const messagesDiv = document.getElementById('messages');
    const generateDiscoveryBtn = document.getElementById('generateDiscoveryBtn');
    const publishPayloadBtn = document.getElementById('publishPayloadBtn');
    const copyBtn = document.getElementById('copyBtn');
    
    let client = null;
    let currentDiscoveryPayload = null;

    // Copy button handler
    copyBtn.addEventListener('click', async () => {
        const content = editor.getValue();
        try {
            await navigator.clipboard.writeText(content);
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
            alert('Failed to copy to clipboard');
        }
    });

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
        // Only enable publish button if we have both a payload and an active MQTT connection
        publishPayloadBtn.disabled = !(client && client.connected);
    });

    publishPayloadBtn.addEventListener('click', () => {
        if (!client || !client.connected) {
            alert('Not connected to MQTT broker.');
            return;
        }

        if (!currentDiscoveryPayload) {
            alert('Please generate the discovery payload first.');
            return;
        }

        const entityId = document.getElementById('entityId').value.trim();
        const discoveryTopic = `homeassistant/device/${entityId}/config`;

        client.publish(discoveryTopic, JSON.stringify(currentDiscoveryPayload), { qos: 2, retain: true }, (err) => {
            if (err) {
                console.error('Publish error: ', err);
                alert('Failed to publish discovery payload.');
            } else {
                alert('Discovery payload published successfully.');
            }
        });
    });
});

function generateDiscoveryPayload({
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
}) {
    // Generate full device ID by combining vendor name and Tasmota ID
    const fullDeviceId = `${irhvacVendor.toLowerCase().replace(/\s+/g, '_')}_${tasmotaId}`;

    const DEVICE = {
        "identifiers": [fullDeviceId],
        "configuration_url": configUrl,
        "name": manufacturer,
        "mf": manufacturer,
        "mdl": model,
        "sa": suggestedArea,
        "sn": serialNumber
    };

    const ORIGIN = {
        "name": "Tasmota-IR",
        "sw_version": "14.4.1 (release-ir)",
        "support_url": configUrl
    };

    const CLIMATE = {
        "p": "climate",
        "name": suggestedArea,
        "unique_id": `${fullDeviceId}_climate`,
        "object_id": entityId,
        "modes": modes,
        "fan_modes": fanModes,
        "temperature_unit": tempUnit,
        "temp_step": tempStep,
        "min_temp": minTemp,
        "max_temp": maxTemp,
        "optimistic": true,
        "command_topic": `cmnd/${tasmotaId}/irhvac`,
        "swing_modes": swingModes,
        "qos": 2
    };

    const commandTemplates = generateCommandTemplates(entityId, irhvacVendor, tempUnit);

    const discoveryPayload = {
        "dev": DEVICE,
        "origin": ORIGIN,
        "cmps": {
            "climate": {
                "p": CLIMATE["p"],
                "name": CLIMATE["name"],
                "unique_id": CLIMATE["unique_id"],
                "object_id": CLIMATE["object_id"],
                "modes": CLIMATE["modes"],
                "fan_modes": CLIMATE["fan_modes"],
                "temperature_unit": CLIMATE["temperature_unit"],
                "temp_step": CLIMATE["temp_step"],
                "min_temp": CLIMATE["min_temp"],
                "max_temp": CLIMATE["max_temp"],
                "optimistic": CLIMATE["optimistic"],
                "swing_modes": CLIMATE["swing_modes"],
                "qos": CLIMATE["qos"],
                "power_command_topic": CLIMATE["command_topic"],
                "power_command_template": commandTemplates["power"],
                "mode_command_topic": CLIMATE["command_topic"],
                "mode_command_template": commandTemplates["mode"],
                "mode_state_topic": `homeassistant/climate/${irhvacVendor.toLowerCase()}_${tasmotaId}/state`,
                "mode_state_template": "{{ value_json.mode | lower }}",
                "temperature_command_topic": CLIMATE["command_topic"],
                "temperature_command_template": commandTemplates["temperature"],
                "temperature_state_topic": `homeassistant/climate/${irhvacVendor.toLowerCase()}_${tasmotaId}/state`,
                "temperature_state_template": "{{ value_json.temp }}",
                "fan_mode_command_topic": CLIMATE["command_topic"],
                "fan_mode_command_template": commandTemplates["fan_mode"],
                "fan_mode_state_topic": `homeassistant/climate/${irhvacVendor.toLowerCase()}_${tasmotaId}/state`,
                "fan_mode_state_template": "{{ value_json.fanspeed }}",
                "swing_mode_command_topic": CLIMATE["command_topic"],
                "swing_mode_command_template": commandTemplates["swing_mode"],
                "swing_mode_state_topic": `homeassistant/climate/${irhvacVendor.toLowerCase()}_${tasmotaId}/state`,
                "swing_mode_state_template": "{{ value_json.swingv }}"
            }
        },
        "qos": CLIMATE["qos"]
    };

    return discoveryPayload;
}

function generateCommandTemplates(entityId, irhvacVendor, tempUnit) {
    const defaultKeys = {
        "Vendor": irhvacVendor,
        "Power": `{{ state_attr('climate.${entityId}', 'power') }}`,
        "Mode": `{{ state_attr('climate.${entityId}', 'mode') }}`,
        "Temp": `{{ state_attr('climate.${entityId}', 'temperature') }}`,
        "Celsius": tempUnit === 'C' ? "On" : "Off",
        "FanSpeed": `{{ state_attr('climate.${entityId}', 'fan_mode') }}`,
        "Quiet": `{{ 'On' if state_attr('climate.${entityId}', 'fan_mode') == 'Min' else 'Off' }}`,
        "SwingV": `{{ state_attr('climate.${entityId}', 'swing_mode') }}`
    };

    const commandsOverrides = {
        "power": {
            "Power": "{{ value }}"
        },
        "mode": {
            "Mode": "{{ value }}",
            "Power": "{{ 'Off' if value == 'off' else 'On' }}"
        },
        "temperature": {
            "Temp": "{{ value }}"
        },
        "fan_mode": {
            "FanSpeed": "{{ value }}",
            "Quiet": "{{ 'On' if value == 'Min' else 'Off' }}"
        },
        "swing_mode": {
            "SwingV": "{{ value }}"
        }
    };

    const commandTemplates = {};
    for (const [cmdType, overrides] of Object.entries(commandsOverrides)) {
        const command = { ...defaultKeys, ...overrides };
        commandTemplates[cmdType] = JSON.stringify(command);
    }

    return commandTemplates;
}
