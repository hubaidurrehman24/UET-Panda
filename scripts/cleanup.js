
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

async function cleanup() {
  console.log("Starting full platform reset...");

  try {
    // 1. Wipe Orders
    console.log("Deleting 'orders' node...");
    await db.ref('orders').remove();
    console.log("Orders cleared successfully.");

    // 2. Wipe Reviews
    console.log("Deleting 'reviews' node...");
    await db.ref('reviews').remove();
    console.log("Reviews cleared successfully.");

    // 3. Delete Student Users
    console.log("Fetching users from DB to identify students...");
    const usersSnapshot = await db.ref('users').get();
    const studentUids = [];
    
    if (usersSnapshot.exists()) {
      const usersData = usersSnapshot.val();
      for (const [uid, user] of Object.entries(usersData)) {
        if (user.role === 'student') {
          studentUids.push(uid);
        }
      }
    }

    console.log(`Found ${studentUids.length} student profiles in DB.`);

    // 4. Delete From Firebase Auth and DB
    for (const uid of studentUids) {
      try {
        console.log(`Deleting student ${uid} from Auth...`);
        await admin.auth().deleteUser(uid);
        console.log(`Deleting student ${uid} profile from DB...`);
        await db.ref(`users/${uid}`).remove();
      } catch (e) {
        console.error(`Error deleting student ${uid}:`, e.message);
        // Sometimes user might exist in DB but not in Auth if manually handled
        if (e.code === 'auth/user-not-found') {
           console.log(`Student ${uid} not found in Auth, removing from DB.`);
           await db.ref(`users/${uid}`).remove();
        }
      }
    }

    // 5. Cleanuporphaned Auth users (not in DB or no role)
    console.log("Checking for orphaned Auth users (students not in DB)...");
    const listUsersResult = await admin.auth().listUsers();
    const adminEmails = ['cafe1@uet.edu.pk', 'cafe2@uet.edu.pk', 'cafe3@uet.edu.pk', 'cafe4@uet.edu.pk'];
    
    for (const userRecord of listUsersResult.users) {
      if (!adminEmails.includes(userRecord.email)) {
        // If they were not in our deletion list already, check if they should be deleted
        if (!studentUids.includes(userRecord.uid)) {
          console.log(`Orphaned/Unknown user found: ${userRecord.email} (${userRecord.uid}). Deleting...`);
          await admin.auth().deleteUser(userRecord.uid);
        }
      } else {
        console.log(`Preserving Admin account: ${userRecord.email}`);
      }
    }

    console.log("\n--- FACTORY RESET COMPLETE ---");
    console.log("All orders, reviews, and student users have been removed.");
    console.log("Admin accounts for Cafe 1-4 have been preserved.");

  } catch (error) {
    console.error("Critical error during cleanup:", error);
  } finally {
    process.exit();
  }
}

cleanup();
