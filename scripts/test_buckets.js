const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (admin.apps.length) { admin.apps.forEach(a => a.delete()); }

// Try without specifying bucket - let it auto-detect
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

// Try different bucket name formats
const formats = [
  "uet-panda-1c0e4.firebasestorage.app",
  "uet-panda-1c0e4.appspot.com",
  "gs://uet-panda-1c0e4.firebasestorage.app"
];

async function testBuckets() {
  const storage = admin.storage();
  
  for (const fmt of formats) {
    try {
      let bkt;
      if (fmt.startsWith("gs://")) {
        bkt = storage.bucket(fmt.replace("gs://", ""));
      } else {
        bkt = storage.bucket(fmt);
      }
      await bkt.save && bkt.save; // just access the object
      const [exists] = await bkt.exists();
      console.log(`${fmt}: exists=${exists}`);
    } catch (e) {
      console.log(`${fmt}: ERROR - ${e.message}`);
    }
  }
  process.exit();
}

testBuckets();
