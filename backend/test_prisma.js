
const prisma = require('./src/utils/prisma').default;

async function test() {
    try {
        console.log('Testing prisma instance...');
        console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('_')));
        if (prisma.attendance) {
            console.log('SUCCESS: prisma.attendance exists!');
        } else {
            console.log('FAILURE: prisma.attendance does NOT exist.');
        }
    } catch (e) {
        console.error('Error during test:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
