const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (admin.apps.length) { admin.apps.forEach(a => a.delete()); }

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "uet-panda-1c0e4.firebasestorage.app"
});

const bucket = admin.storage().bucket();

async function testStorage() {
  try {
    console.log("Bucket name:", bucket.name);
    // Try to create a tiny test file
    const file = bucket.file("test_ping.txt");
    await file.save(Buffer.from("hello"), { metadata: { contentType: "text/plain" }, resumable: false });
    console.log("SUCCESS: Storage is writable!");
    await file.delete();
    console.log("Test file deleted.");
  } catch (e) {
    console.error("Storage Error:", e.message);
    console.error("Code:", e.code);
    console.error("Errors:", JSON.stringify(e.errors, null, 2));
  }
  process.exit();
}

testStorage();
