import dotenv from 'dotenv';
import path from 'path';
import { verifyConnection } from './src/utils/email';

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
    console.log('Testing Email Connection...');
    console.log('Host:', process.env.EMAIL_HOST);
    console.log('Port:', process.env.EMAIL_PORT);
    console.log('User:', process.env.EMAIL_USER);
    try {
        const result = await verifyConnection();
        if (result) {
            console.log('Connection Successful!');
            process.exit(0);
        } else {
            console.error('Connection Failed (verifyConnection returned false)');
            process.exit(1);
        }
    } catch (err) {
        console.error('Verification Script Crash:', err);
        process.exit(1);
    }
}

run();
