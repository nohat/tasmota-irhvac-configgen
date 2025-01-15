# tasmota-irhvac-configgen

Generate MQTT configs for Home Assistant for IRHVAC components controlled by a Tasmota IR device

## Overview

This web-based tool simplifies the process of generating MQTT configurations for Home Assistant when using Tasmota-powered IR devices to control HVAC systems. It provides a user-friendly interface to:

- Generate MQTT discovery payloads for Home Assistant integration
- Configure IR codes for various HVAC operations (power, mode, temperature, fan speed, etc.)
- Create ready-to-use automation configurations
- Test MQTT configurations directly from the interface

For more information about the underlying components, see:
- [Tasmota IR Remote Documentation](https://tasmota.github.io/docs/IR-Remote/)
- [Tasmota Commands for IRHVAC](https://tasmota.github.io/docs/Commands/#ir-remote)
- [Home Assistant MQTT Climate Documentation](https://www.home-assistant.io/integrations/climate.mqtt/)

## Installation

This project is hosted using GitHub Pages and doesn't require local installation for users. To access the tool:

1. Visit [https://nohat.github.io/tasmota-irhvac-configgen](https://nohat.github.io/tasmota-irhvac-configgen)

For developers who want to contribute:

1. Clone the repository:
   ```bash
   git clone https://github.com/nohat/tasmota-irhvac-configgen.git
   ```
2. No additional setup is required as the site uses vanilla JavaScript and CSS
3. The site is automatically built and deployed through GitHub Pages using the default Jekyll configuration

## Usage

1. Enter your Tasmota device information:
   - MQTT topic
   - IR codes for different operations
   - Temperature range and supported modes

2. Configure HVAC parameters:
   - Available modes (cool, heat, auto, etc.)
   - Fan speeds
   - Temperature settings

3. Generate configuration:
   - Click "Generate Config" to create MQTT discovery payloads
   - Copy the generated configuration to your Home Assistant setup

4. Test the configuration:
   - Use the built-in MQTT client to test your configuration
   - Verify IR commands are working correctly

## Configuration

### MQTT Settings
- **Topic**: The MQTT topic of your Tasmota device
- **Friendly Name**: The name that will appear in Home Assistant
- **Device ID**: Unique identifier for your device

### HVAC Parameters
- **Temperature Range**: Min and max temperature values
- **Supported Modes**: Configure available modes (cool, heat, dry, fan)
- **Fan Speeds**: Available fan speed settings
- **Swing Settings**: Vertical and horizontal swing options

### IR Commands
Format your IR commands according to Tasmota's IRhvac specifications. Example:
```yaml
Power On: "IRhvac {'Vendor':'BRAND','Power':'On'}"
Power Off: "IRhvac {'Vendor':'BRAND','Power':'Off'}"
```

For a complete list of supported vendors and command formats, refer to the [Tasmota IR Raw vs IRhvac documentation](https://tasmota.github.io/docs/Tasmota-IR/#raw-vs-irhvac).

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit with clear, descriptive messages
6. Push to your fork: `git push origin feature-name`
7. Create a Pull Request

### Code Standards
- Use consistent indentation (2 spaces)
- Follow JavaScript ES6+ conventions
- Comment complex logic
- Test all changes in multiple browsers

## License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2025 David Friedland

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so.
```

For the complete license text, see the [LICENSE](LICENSE) file.
