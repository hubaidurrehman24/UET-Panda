const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const serviceAccount = require("./scripts/serviceAccountKey.json");

initializeApp({ 
  credential: cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase();

async function verify() {
    const products = await db.ref("products").once("value");
    const all = products.val();
    
    ["cafe1", "cafe2", "cafe3"].forEach(cid => {
        console.log(`\n--- ${cid.toUpperCase()} DEALS ---`);
        const deals = Object.values(all).filter(p => p.cafeId === cid && p.category === "deals");
        deals.slice(0, 5).forEach(d => {
            console.log(`- ${d.name}: ${d.description || "(Empty)"}`);
        });
        if (deals.length > 5) console.log(`... and ${deals.length - 5} more`);
    });
    process.exit(0);
}

verify();
