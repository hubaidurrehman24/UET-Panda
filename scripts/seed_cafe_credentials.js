const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({ 
  credential: cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase();

const cafes = [
  { id: "cafe1", name: "Bhola Cafe", email: "cafe1@uet.edu.pk", password: "password123" },
  { id: "cafe2", name: "GSSC", email: "cafe2@uet.edu.pk", password: "password123" },
  { id: "cafe3", name: "BSSC", email: "cafe3@uet.edu.pk", password: "password123" },
  { id: "cafe4", name: "Annexe Cafe", email: "cafe4@uet.edu.pk", password: "password123" }
];

async function seedCredentials() {
  console.log("Seeding Cafe Credentials to Realtime Database...");
  
  const credentialsRef = db.ref('cafe_credentials');
  
  for (const cafe of cafes) {
    if (cafe.email && cafe.password) {
        await credentialsRef.child(cafe.id).set({
            name: cafe.name,
            email: cafe.email,
            password: cafe.password,
            updatedAt: new Date().toISOString()
        });
        console.log(`Saved credentials for ${cafe.id} (${cafe.name})`);
    } else {
        console.log(`Missing credentials in .env for ${cafe.id}`);
    }
  }

  console.log("Finished seeding Cafe credentials.");
  process.exit(0);
}

seedCredentials().catch(console.error);
