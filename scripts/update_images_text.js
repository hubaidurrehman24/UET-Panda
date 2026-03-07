const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({ 
  credential: cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase();

async function updateImages() {
  console.log("Starting image update to dynamic text placeholders...");
  
  try {
    const productsRef = db.ref("products");
    const snapshot = await productsRef.once("value");
    const products = snapshot.val();
    
    if (!products) {
      console.log("No products found.");
      return;
    }
    
    let updatedCount = 0;
    const updates = {};
    
    for (const [id, product] of Object.entries(products)) {
        // Create an image using placehold.co with UET Gold and Navy colors
        // Format: https://placehold.co/600x400/FFD700/002366?text=Burger+Name
        const encodedName = encodeURIComponent(product.name);
        const imageUrl = `https://placehold.co/600x400/FFD700/002366?text=${encodedName}`;
        
        updates[`${id}/image`] = imageUrl;
        updatedCount++;
    }
    
    console.log(`Found ${updatedCount} products to update. Executing batch update...`);
    await productsRef.update(updates);
    
    console.log(`Successfully updated ${updatedCount} products with dynamic placeholders!`);
    process.exit(0);
  } catch (error) {
    console.error("Error updating images:", error);
    process.exit(1);
  }
}

updateImages();
