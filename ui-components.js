async function loadAceEditor() {
    if (window.ace) return;
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/ace.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export async function initializeEditor() {
    try {
        await loadAceEditor();
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
        return editor;
    } catch (err) {
        console.error('Failed to initialize editor:', err);
        throw err;
    }
}

export function initializeCopyButton(editor) {
    const copyBtn = document.getElementById('copyBtn');
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
} 