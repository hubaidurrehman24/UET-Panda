const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getDatabase } = require("firebase-admin/database");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({ 
  credential: cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const auth = getAuth();
const db = getDatabase();

const cafes = [
  { id: "cafe1", name: "Cafe 1", email: process.env.CAFE1_EMAIL, password: process.env.CAFE1_PASSWORD },
  { id: "cafe2", name: "Cafe 2", email: process.env.CAFE2_EMAIL, password: process.env.CAFE2_PASSWORD },
  { id: "cafe3", name: "Cafe 3", email: process.env.CAFE3_EMAIL, password: process.env.CAFE3_PASSWORD },
  { id: "cafe4", name: "Cafe 4", email: process.env.CAFE4_EMAIL, password: process.env.CAFE4_PASSWORD }
];

async function createAdminAccounts() {
  console.log("Creating strict Admin accounts for Cafe Owners...");
  
  for (const cafe of cafes) {
    try {
      // 1. Try to create user
      let userRecord;
      try {
        userRecord = await auth.createUser({
          email: cafe.email,
          password: cafe.password,
          displayName: cafe.name,
        });
        console.log(`Created Auth user for ${cafe.id} with UID: ${userRecord.uid}`);
      } catch (err) {
        if (err.code === "auth/email-already-exists") {
          console.log(`Auth user for ${cafe.id} already exists. Fetching UID...`);
          userRecord = await auth.getUserByEmail(cafe.email);
        } else {
          throw err;
        }
      }

      // 2. Add admin role to Realtime DB
      await db.ref(`users/${userRecord.uid}`).set({
        name: cafe.name,
        email: cafe.email,
        role: "admin",
        cafeId: cafe.id,
        createdAt: new Date().toISOString()
      });
      console.log(`Set admin privileges (role: "admin", cafeId: "${cafe.id}") in Realtime Database for ${cafe.email}`);

    } catch (error) {
      console.error(`Error processing ${cafe.id}:`, error);
    }
  }

  console.log("Finished creating all Cafe Admin accounts.");
  process.exit(0);
}

createAdminAccounts();
