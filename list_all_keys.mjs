import fs from 'fs';

function readUtf16le(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        let text = buffer.toString('utf16le');
        
        // Strip BOM if present
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }

        const data = JSON.parse(text);
        
        if (Array.isArray(data)) {
            console.log(`Found ${data.length} keys in ${filePath}:`);
            data.forEach((k, i) => {
                const proj = k.projectNumber || k.projectId || 'Unknown';
                const keySnippet = k.apiKey ? k.apiKey.slice(0, 10) + '...' : 'N/A';
                console.log(`[${i}] Project: ${proj}, Key: ${keySnippet}`);
            });
        } else {
            console.log(`Content of ${filePath} is not an array.`);
        }
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
    }
}

readUtf16le('all_keys.json');
readUtf16le('api_keys_output.json');
