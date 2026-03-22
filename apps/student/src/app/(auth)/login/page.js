"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "@uet-panda/shared-config";
import { ref, get, set } from "firebase/database";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push(redirectUrl);
    } catch (err) {
      console.error("[Student Login] Email/password sign-in failed:", err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in db
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        await set(userRef, {
          name: user.displayName || "Google User",
          email: user.email,
          role: "student",
          createdAt: new Date().toISOString()
        });
      }
      
      router.push(redirectUrl);
    } catch (error) {
      console.error("[Student Login] Google sign-in failed:", error);
      setError("Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-uet-navy flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-uet-gold/10 rounded-full -mr-64 -mt-64 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full -ml-64 -mb-64 blur-[100px]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo Section */}
        <div className="text-center mb-10">
          <img src="/logo.png" alt="Logo" style={{ width: '130px', height: 'auto' }} className="mx-auto mb-6" />
          {/* 
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-block bg-uet-gold p-4 rounded-3xl shadow-gold mb-4"
          >
            <LogIn size={32} className="text-uet-navy" />
          </motion.div>
          <h1 className="text-3xl font-poppins font-bold text-white">
            Welcome to <span className="text-uet-gold">UET PANDA</span>
          </h1>
          */}
          <p className="text-blue-100/60 mt-2 font-medium italic">Independent Cafes, Unified Flavor</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] shadow-2xl">
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

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-blue-100/80 text-sm font-bold mb-2 ml-1 uppercase tracking-wider">Email Address</label>
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
            <div>
              <label className="block text-blue-100/80 text-sm font-bold mb-2 ml-1 uppercase tracking-wider">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-blue-100/40 group-focus-within:text-uet-gold transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 text-white py-3.5 pl-12 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-uet-gold focus:bg-white/10 transition-all placeholder:text-white/20 font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-blue-100/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <Link href="#" className="text-uet-gold/60 hover:text-uet-gold text-xs font-bold transition-colors">Forgot Password?</Link>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full bg-uet-gold text-uet-navy py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-gold transition-all active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white'}`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-uet-navy"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            
            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative bg-[#002366] px-4 text-xs tracking-widest text-blue-100/40 uppercase font-bold">Or</div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white text-slate-800 py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 transition-all active:scale-95 hover:bg-slate-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>
          </form>

          {/* Footer Card Section */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-blue-100/40 text-sm font-medium">
              Don't have an account? 
              <Link href="/register" className="text-uet-gold ml-1 font-bold hover:underline transition-all">Sign Up</Link>
            </p>
          </div>
        </div>

        {/* Cafe Select Link for quick testing */}
        <div className="mt-8 flex justify-center space-x-6 text-xs font-bold text-blue-100/30 uppercase tracking-[0.2em]">
          <Link href="/" className="hover:text-uet-gold transition-colors">Student View</Link>
          <span className="text-white/10">|</span>
          <Link href="/admin/login" className="hover:text-uet-gold transition-colors">Cafe Admin</Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-uet-navy flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-uet-gold"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
