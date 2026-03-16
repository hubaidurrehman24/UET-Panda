
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

const projectId = 'uet-panda-1c0e4';
const variations = [
  `${projectId}.firebasestorage.app`,
  `${projectId}.appspot.com`,
  `${projectId}`,
  `staging.${projectId}.appspot.com`,
  `${projectId}.asia-southeast1.firebasedatabase.app` // unlikely but checking patterns
];

async function test() {
  for (const v of variations) {
    console.log(`Testing: ${v}...`);
    try {
      if (admin.apps.length) admin.app().delete();
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: v
      });
      const bucket = admin.storage().bucket();
      const [exists] = await bucket.exists();
      if (exists) {
        console.log(`>>> SUCCESS! Bucket ${v} exists.`);
        process.exit(0);
      }
    } catch (e) {
      console.log(`Failed ${v}: ${e.message}`);
    }
  }
  console.log("None of the variations worked.");
  process.exit(1);
}

test();
