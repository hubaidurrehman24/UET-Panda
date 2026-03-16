
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

async function check() {
  try {
    const bucket = admin.storage().bucket();
    console.log("Default bucket name:", bucket.name);
    const [exists] = await bucket.exists();
    console.log("Exists:", exists);
  } catch (e) {
    console.log("Error:", e.message);
  }
  process.exit();
}

check();
