
const http = require('http');

const testEndpoint = (path) => {
    return new Promise((resolve) => {
        console.log(`Testing ${path}...`);
        const req = http.get(`http://localhost:5000${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log(`Response for ${path}: Status ${res.statusCode}`);
                console.log(`Body: ${data}`);
                resolve();
            });
        });
        req.on('error', (err) => {
            console.error(`Request to ${path} failed: ${err.message}`);
            resolve();
        });
    });
};

async function runTests() {
    await testEndpoint('/health');
    await testEndpoint('/api/branding');
}

runTests();
