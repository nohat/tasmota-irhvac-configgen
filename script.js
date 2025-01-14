import { initializeEditor, initializeCopyButton } from './ui-components.js?v={{ site.time | date: "%Y%m%d%H%M%S" }}';
import { MQTTClient } from './mqtt-client.js?v={{ site.time | date: "%Y%m%d%H%M%S" }}';
import { initializeFormHandlers } from './form-handler.js?v={{ site.time | date: "%Y%m%d%H%M%S" }}';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI components
    const editor = initializeEditor();
    initializeCopyButton(editor);

    // Initialize MQTT client
    const mqttClient = new MQTTClient();

    // Initialize form handlers
    initializeFormHandlers(editor, mqttClient);
});
