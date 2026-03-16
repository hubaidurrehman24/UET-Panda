
const admin = require('firebase-admin');
const sa = require('./scripts/serviceAccountKey.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
}

const db = admin.database();

async function cleanStart() {
  console.log('Cleaning up cafe1 data...');
  await db.ref('menu/cafe1').remove();
  await db.ref('deals/cafe1').remove();
  console.log('Cleanup complete. Ready for re-migration.');
  process.exit();
}

cleanStart().catch(err => {
  console.error(err);
  process.exit(1);
});
