function generateCommandTemplates(entityId, irhvacVendor, tempUnit) {
    const defaultKeys = {
        'Vendor': irhvacVendor,
        'Power': `{{ state_attr('climate.${entityId}', 'power') }}`,
        'Mode': `{{ state_attr('climate.${entityId}', 'mode') }}`,
        'Temp': `{{ state_attr('climate.${entityId}', 'temperature') }}`,
        'Celsius': tempUnit === 'C' ? 'On' : 'Off',
        'FanSpeed': `{{ state_attr('climate.${entityId}', 'fan_mode') }}`,
        'Quiet': `{{ 'On' if state_attr('climate.${entityId}', 'fan_mode') == 'Min' else 'Off' }}`,
        'SwingV': `{{ state_attr('climate.${entityId}', 'swing_mode') }}`
    };

    const commandsOverrides = {
        'power': {
            'Power': '{{ value }}'
        },
        'mode': {
            'Mode': '{{ value }}',
            'Power': '{{ \'Off\' if value == \'off\' else \'On\' }}'
        },
        'temperature': {
            'Temp': '{{ value }}'
        },
        'fan_mode': {
            'FanSpeed': '{{ value }}',
            'Quiet': '{{ \'On\' if value == \'Min\' else \'Off\' }}'
        },
        'swing_mode': {
            'SwingV': '{{ value }}'
        }
    };

    const commandTemplates = {};
    for (const [cmdType, overrides] of Object.entries(commandsOverrides)) {
        const command = { ...defaultKeys, ...overrides };
        commandTemplates[cmdType] = JSON.stringify(command);
    }

    return commandTemplates;
}

export function generateDiscoveryPayload({
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
    const fullDeviceId = `${irhvacVendor.toLowerCase().replace(/\s+/g, '_')}_${tasmotaId}`;

    const DEVICE = {
        'identifiers': [fullDeviceId],
        'configuration_url': configUrl,
        'name': manufacturer,
        'mf': manufacturer,
        'mdl': model,
        'sa': suggestedArea,
        'sn': serialNumber
    };

    const ORIGIN = {
        'name': 'Tasmota-IR',
        'sw_version': '14.4.1 (release-ir)',
        'support_url': configUrl
    };

    const CLIMATE = {
        'p': 'climate',
        'name': suggestedArea,
        'unique_id': `${fullDeviceId}_climate`,
        'object_id': entityId,
        'modes': modes,
        'fan_modes': fanModes,
        'temperature_unit': tempUnit,
        'temp_step': tempStep,
        'min_temp': minTemp,
        'max_temp': maxTemp,
        'optimistic': true,
        'command_topic': `cmnd/${tasmotaId}/irhvac`,
        'swing_modes': swingModes,
        'qos': 2
    };

    const commandTemplates = generateCommandTemplates(entityId, irhvacVendor, tempUnit);

    const discoveryPayload = {
        'dev': DEVICE,
        'origin': ORIGIN,
        'cmps': {
            'climate': {
                'p': CLIMATE['p'],
                'name': CLIMATE['name'],
                'unique_id': CLIMATE['unique_id'],
                'object_id': CLIMATE['object_id'],
                'modes': CLIMATE['modes'],
                'fan_modes': CLIMATE['fan_modes'],
                'temperature_unit': CLIMATE['temperature_unit'],
                'temp_step': CLIMATE['temp_step'],
                'min_temp': CLIMATE['min_temp'],
                'max_temp': CLIMATE['max_temp'],
                'optimistic': CLIMATE['optimistic'],
                'swing_modes': CLIMATE['swing_modes'],
                'qos': CLIMATE['qos'],
                'power_command_topic': CLIMATE['command_topic'],
                'power_command_template': commandTemplates['power'],
                'mode_command_topic': CLIMATE['command_topic'],
                'mode_command_template': commandTemplates['mode'],
                'mode_state_topic': `homeassistant/climate/${irhvacVendor.toLowerCase()}_${tasmotaId}/state`,
                'mode_state_template': '{{ value_json.mode | lower }}',
                'temperature_command_topic': CLIMATE['command_topic'],
                'temperature_command_template': commandTemplates['temperature'],
                'temperature_state_topic': `homeassistant/climate/${irhvacVendor.toLowerCase()}_${tasmotaId}/state`,
                'temperature_state_template': '{{ value_json.temp }}',
                'fan_mode_command_topic': CLIMATE['command_topic'],
                'fan_mode_command_template': commandTemplates['fan_mode'],
                'fan_mode_state_topic': `homeassistant/climate/${irhvacVendor.toLowerCase()}_${tasmotaId}/state`,
                'fan_mode_state_template': '{{ value_json.fanspeed }}',
                'swing_mode_command_topic': CLIMATE['command_topic'],
                'swing_mode_command_template': commandTemplates['swing_mode'],
                'swing_mode_state_topic': `homeassistant/climate/${irhvacVendor.toLowerCase()}_${tasmotaId}/state`,
                'swing_mode_state_template': '{{ value_json.swingv }}'
            }
        },
        'qos': CLIMATE['qos']
    };

    return discoveryPayload;
} 