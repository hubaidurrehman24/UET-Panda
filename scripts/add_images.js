const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({ 
  credential: cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase();

const categoryImages = {
  "fast-food": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500&auto=format&fit=crop",
  "desi": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=500&auto=format&fit=crop",
  "chinese": "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=500&auto=format&fit=crop",
  "deals": "https://images.unsplash.com/photo-1626229652216-e59508ca4600?q=80&w=500&auto=format&fit=crop",
  "snacks": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=500&auto=format&fit=crop",
  "drinks": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=500&auto=format&fit=crop",
  "breakfast": "https://images.unsplash.com/photo-1493770348161-369560ae357d?q=80&w=500&auto=format&fit=crop",
};

async function addImages() {
  const productsRef = db.ref("products");
  const snapshot = await productsRef.once("value");
  const data = snapshot.val();

  if (!data) {
    console.log("No products found.");
    return;
  }

  const updates = {};
  let count = 0;

  for (const [key, item] of Object.entries(data)) {
    if (!item.image || item.image === "") {
      const cat = item.category || "desi";
      const image = categoryImages[cat] || categoryImages["desi"];
      updates[`${key}/image`] = image;
      count++;
    }
  }

  if (Object.keys(updates).length > 0) {
    await productsRef.update(updates);
    console.log(`Successfully added images to ${count} products.`);
  } else {
    console.log("All products already have images.");
  }

  process.exit(0);
}

addImages().catch(console.error);
