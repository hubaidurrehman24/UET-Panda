const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({ 
  credential: cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase();

const seedRiders = async () => {
  const cafes = ["cafe1", "cafe2", "cafe3", "cafe4"];
  const riderNames = [
    "Ahmad Ali", "Usman Tariq", "Bilal Khan",
    "Hamza Shah", "Hassan Raza", "Zain Khalid",
    "Ali Ibrahim", "Faizan Mahmood", "Saad Waqas",
    "Omar Farooq", "Shoaib Javed", "Waqar Younis"
  ];
  const phones = [
    "0300-1111111", "0301-2222222", "0302-3333333",
    "0303-4444444", "0304-5555555", "0305-6666666",
    "0306-7777777", "0307-8888888", "0308-9999999",
    "0309-1010101", "0310-2020202", "0311-3030303"
  ];

  let nameIndex = 0;
  let updates = {};

  try {
    for (const cafeId of cafes) {
      for (let i = 0; i < 3; i++) {
        const riderId = db.ref().child(`riders/${cafeId}`).push().key;
        updates[`riders/${cafeId}/${riderId}`] = {
          name: riderNames[nameIndex],
          phone: phones[nameIndex],
          deliveryCount: 0,
          createdAt: new Date().toISOString()
        };
        nameIndex++;
      }
    }
    
    await db.ref().update(updates);
    console.log("Successfully seeded 12 riders across 4 cafes.");
  } catch (error) {
    console.error("Error seeding riders:", error);
  } finally {
    process.exit();
  }
};

seedRiders();
