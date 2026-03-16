
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function findBucket() {
  const storage = admin.storage();
  // Try to list buckets if allowed (service account often has this permission)
  try {
    const [buckets] = await storage.getBuckets();
    console.log("Available buckets:");
    buckets.forEach(b => console.log(` - ${b.name}`));
  } catch (e) {
    console.log(`Failed to list buckets: ${e.message}`);
    // Fallback: try to see if .appspot.com exists
    try {
        const b = storage.bucket("uet-panda-1c0e4.appspot.com");
        const [exists] = await b.exists();
        console.log(`uet-panda-1c0e4.appspot.com exists: ${exists}`);
    } catch (e2) {
        console.log(`Error checking appspot: ${e2.message}`);
    }
  }
  process.exit();
}

findBucket();
