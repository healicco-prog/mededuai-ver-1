import fs from 'fs';

function readUtf16le(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        const text = buffer.toString('utf16le');
        console.log(`Content of ${filePath} (UTF-16LE):`);
        console.log(text.substring(0, 1000));
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
    }
}

readUtf16le('api_keys_output.json');
readUtf16le('all_keys.json');
