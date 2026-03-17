import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import * as path from "path";

// Initialize Firebase Admin only once
if (!getApps().length) {
  try {
    const serviceAccount = require("../../../../../../../scripts/serviceAccountKey.json");
    
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

export async function POST(request) {
  try {
    const { cafeId, email, newPassword } = await request.json();

    if (!cafeId || !email || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const auth = getAuth();
    const db = getDatabase();

    // 1. Force the password change on the Firebase Auth user object
    let userRecord;
    try {
        userRecord = await auth.getUserByEmail(email);
    } catch (err) {
        if (err.code === 'auth/user-not-found') {
            return NextResponse.json(
                { success: false, error: "Firebase User not found for " + email },
                { status: 404 }
            );
        }
        throw err;
    }

    await auth.updateUser(userRecord.uid, {
        password: newPassword
    });

    // 2. Overwrite the tracked plain-text password in our secure db node
    await db.ref(`cafe_credentials/${cafeId}`).update({
        password: newPassword,
        updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
        success: true, 
        message: "Password securely updated in Firebase Auth and Realtime Database" 
    });

  } catch (error) {
    console.error("Update Cafe Credentials Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
