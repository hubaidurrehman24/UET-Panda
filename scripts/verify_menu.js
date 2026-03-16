const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (admin.apps.length) { admin.apps.forEach(a => a.delete()); }
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

const CAFE_NAMES = { cafe1: 'Bhola', cafe2: 'GSSC', cafe3: 'BSSC' };

async function verify() {
  for (const [cafeId, cafeName] of Object.entries(CAFE_NAMES)) {
    const snap = await db.ref(`menu/${cafeId}`).once('value');
    const items = Object.values(snap.val() || {});
    const withImages = items.filter(i => i.image && i.image.length > 0);
    const categories = {};
    items.forEach(i => { categories[i.category] = (categories[i.category] || 0) + 1; });
    
    console.log(`\n=== ${cafeName} (${cafeId}) ===`);
    console.log(`  Total items : ${items.length}`);
    console.log(`  With images : ${withImages.length}`);
    console.log(`  No images   : ${items.length - withImages.length}`);
    console.log(`  Categories  :`, categories);
    console.log(`  Sample:`);
    items.slice(0, 5).forEach(i =>
      console.log(`    [${i.category}] ${i.name} Rs.${i.price}  img:${i.image ? '✓' : '✗'}`)
    );
  }
  process.exit();
}

verify().catch(console.error);
