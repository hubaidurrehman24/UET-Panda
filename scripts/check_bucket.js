
const admin = require('firebase-admin');
const fs = require('fs');

const saPath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\scripts\\serviceAccountKey.json';
const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));

async function check() {
  try {
    console.log('Initializing admin...');
    admin.initializeApp({
      credential: admin.credential.cert(sa)
    });
    console.log('Listing buckets...');
    const [buckets] = await admin.storage().getBuckets();
    console.log(`Found ${buckets.length} buckets:`);
    buckets.forEach(b => console.log(' - ' + b.name));
  } catch (err) {
    console.error('Check failed:', err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    process.exit();
  }
}

check();
