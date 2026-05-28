import fs from 'fs';

function inspectJson(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        let text = buffer.toString('utf16le');
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        const data = JSON.parse(text);
        
        if (Array.isArray(data) && data.length > 0) {
            console.log(`Keys in ${filePath}[0]:`, Object.keys(data[0]));
            console.log('Sample object:', JSON.stringify(data[0], null, 2));
        }
    } catch (err) {
        console.error(err);
    }
}

inspectJson('all_keys.json');
