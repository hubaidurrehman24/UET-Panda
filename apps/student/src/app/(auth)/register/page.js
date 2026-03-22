"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@uet-panda/shared-config";
import { ref, set } from "firebase/database";
import { motion } from "framer-motion";
import { Mail, Lock, User, UserPlus, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Update profile with display name
      await updateProfile(user, { displayName: name });

      // 3. Save user data to Realtime Database
      await set(ref(db, `users/${user.uid}`), {
        name,
        email,
        role: "student",
        createdAt: new Date().toISOString()
      });

      router.push("/");
    } catch (err) {
      console.error("[Student Register] Account creation failed:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered.");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-uet-navy flex items-center justify-center p-4 overflow-hidden relative font-sans">
      {/* Animated Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-uet-gold/10 rounded-full -mr-64 -mt-64 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full -ml-64 -mb-64 blur-[100px]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header Section */}
        <div className="text-center mb-10">
          <img src="/logo.png" alt="Logo" style={{ width: '130px', height: 'auto' }} className="mx-auto mb-6" />
          {/* 
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-block bg-uet-gold p-4 rounded-3xl shadow-gold mb-4"
          >
            <UserPlus size={32} className="text-uet-navy" />
          </motion.div>
          <h1 className="text-3xl font-poppins font-bold text-white">
            Create <span className="text-uet-gold">Account</span>
          </h1>
          */}
          <p className="text-blue-100/60 mt-2 font-medium italic">Join UET PANDA today</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2.5rem] shadow-2xl">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-2xl mb-6 flex items-center space-x-3"
            >
              <AlertCircle size={20} className="flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label className="block text-blue-100/80 text-[11px] font-bold mb-1.5 ml-1 uppercase tracking-widest">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-blue-100/40 group-focus-within:text-uet-gold transition-colors">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  required
                  placeholder="Enter your full name"
                  className="w-full bg-white/5 border border-white/10 text-white py-3.5 pl-12 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-uet-gold focus:bg-white/10 transition-all placeholder:text-white/20 font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-blue-100/80 text-[11px] font-bold mb-1.5 ml-1 uppercase tracking-widest">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-blue-100/40 group-focus-within:text-uet-gold transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  required
                  placeholder="name@uet.edu.pk"
                  className="w-full bg-white/5 border border-white/10 text-white py-3.5 pl-12 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-uet-gold focus:bg-white/10 transition-all placeholder:text-white/20 font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-blue-100/80 text-[11px] font-bold mb-1.5 ml-1 uppercase tracking-widest">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-blue-100/40 group-focus-within:text-uet-gold transition-colors">
                    <Lock size={16} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••"
                    className="w-full bg-white/5 border border-white/10 text-white py-3.5 pl-11 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-uet-gold focus:bg-white/10 transition-all placeholder:text-white/20 font-medium text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-blue-100/80 text-[11px] font-bold mb-1.5 ml-1 uppercase tracking-widest">Confirm</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-blue-100/40 group-focus-within:text-uet-gold transition-colors">
                    <Lock size={16} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••"
                    className="w-full bg-white/5 border border-white/10 text-white py-3.5 pl-11 pr-11 rounded-2xl focus:outline-none focus:ring-2 focus:ring-uet-gold focus:bg-white/10 transition-all placeholder:text-white/20 font-medium text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-blue-100/40 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full bg-uet-gold text-uet-navy py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-gold transition-all active:scale-95 mt-4 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white'}`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-uet-navy"></div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer Section */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-blue-100/40 text-sm font-medium">
              Already have an account? 
              <Link href="/login" className="text-uet-gold ml-1 font-bold hover:underline transition-all">Sign In</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
