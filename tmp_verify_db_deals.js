const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const serviceAccount = require("./scripts/serviceAccountKey.json");

initializeApp({ 
  credential: cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase();

async function verify() {
    const snapshot = await db.ref("products").orderByChild("category").equalTo("deals").once("value");
    const deals = snapshot.val();
    if (!deals) {
        console.log("No deals found!");
    } else {
        console.log(`Found ${Object.keys(deals).length} deals:`);
        Object.entries(deals).forEach(([id, item]) => {
            console.log(`- [${item.cafeId}] ${item.name}: ${item.description || "(No description)"}`);
        });
    }
    process.exit(0);
}

verify();
