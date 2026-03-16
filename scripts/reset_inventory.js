
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

async function resetInventory() {
  console.log("Starting Inventory Reset (Menu & Deals)...");

  try {
    // 1. Wipe Menu
    console.log("Deleting 'menu' node...");
    await db.ref('menu').remove();
    console.log("Menu cleared successfully.");

    // 2. Wipe Deals
    console.log("Deleting 'deals' node...");
    await db.ref('deals').remove();
    console.log("Deals cleared successfully.");

    console.log("\n--- INVENTORY RESET COMPLETE ---");
    console.log("The system is now clean and ready for rebranding and fresh data upload.");

  } catch (error) {
    console.error("Critical error during inventory reset:", error);
  } finally {
    process.exit();
  }
}

resetInventory();
