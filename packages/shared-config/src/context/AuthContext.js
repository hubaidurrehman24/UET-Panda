"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "../firebase/config";

const AuthContext = createContext({});

export const useAuthContext = () => useContext(AuthContext);

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); // 'student' or 'admin'
  const [cafeId, setCafeId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Fetch user role from Realtime Database
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUserRole(userData.role);
          setCafeId(userData.cafeId || null);
        } else {
          // Default to student if no node exists (auto-created on first login)
          setUserRole("student");
        }
      } else {
        setUser(null);
        setUserRole(null);
        setCafeId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, cafeId, loading }}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen bg-uet-navy text-uet-gold">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-uet-gold"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
