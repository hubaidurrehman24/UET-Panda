const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const serviceAccount = require("./scripts/serviceAccountKey.json");

initializeApp({ 
  credential: cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase();

async function verify() {
    const snapshot = await db.ref("products").orderByChild("cafeId").equalTo("cafe2").once("value");
    const cafe2Products = snapshot.val();
    console.log("--- Cafe 2 Deals ---");
    Object.values(cafe2Products).filter(p => p.category === "deals").forEach(p => {
        console.log(`- ${p.name}: ${p.description}`);
    });

    const snapshot3 = await db.ref("products").orderByChild("cafeId").equalTo("cafe3").once("value");
    const cafe3Products = snapshot3.val();
    console.log("\n--- Cafe 3 Deals ---");
    Object.values(cafe3Products).filter(p => p.category === "deals").forEach(p => {
        console.log(`- ${p.name}: ${p.description}`);
    });
    process.exit(0);
}

verify();
