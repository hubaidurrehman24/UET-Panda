"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "@/firebase/config";
import { ref, get, set } from "firebase/database";
import { motion } from "framer-motion";
import { User, Mail, Lock, UserPlus, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RegisterContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/login";

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Realtime Database
      await set(ref(db, `users/${user.uid}`), {
        name,
        email,
        role: "student",
        createdAt: new Date().toISOString()
      });

      setSuccess(true);
      setTimeout(() => {
        router.push(redirectUrl);
      }, 2000);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered.");
      } else {
        setError("Failed to create account. Please try again.");
      }
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
      
      router.push(redirectUrl === "/login" ? "/" : redirectUrl);
    } catch (error) {
      console.error(error);
      setError("Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-uet-navy flex items-center justify-center p-4 overflow-hidden relative font-sans">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-uet-gold/10 rounded-full -mr-64 -mt-64 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full -ml-64 -mb-64 blur-[100px]"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-block bg-uet-gold p-4 rounded-3xl shadow-gold mb-4"
          >
            <UserPlus size={32} className="text-uet-navy" />
          </motion.div>
          <h1 className="text-3xl font-poppins font-bold text-white">Create Account</h1>
          <p className="text-blue-100/60 mt-2 font-medium">Join the UET Panda community today</p>
        </div>

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

          {success && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/20 border border-green-500/50 text-green-200 p-4 rounded-2xl mb-6 flex items-center space-x-3"
            >
              <CheckCircle2 size={20} className="flex-shrink-0" />
              <p className="text-sm font-medium">Account created! Redirecting to login...</p>
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Name Field */}
            <div>
              <label className="block text-blue-100/80 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-blue-100/40 group-focus-within:text-uet-gold transition-colors">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 text-white py-3 pr-4 pl-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-uet-gold focus:bg-white/10 transition-all font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-blue-100/80 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-blue-100/40 group-focus-within:text-uet-gold transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  required
                  placeholder="your.email@example.com"
                  className="w-full bg-white/5 border border-white/10 text-white py-3 pr-4 pl-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-uet-gold focus:bg-white/10 transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-blue-100/80 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">Password</label>
                <div className="relative group flex items-center">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-blue-100/40 group-focus-within:text-uet-gold transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 text-white py-3 pr-12 pl-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-uet-gold focus:bg-white/10 transition-all font-medium text-sm"
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
              </div>
              <div>
                <label className="block text-blue-100/80 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">Confirm</label>
                <div className="relative group flex items-center">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-blue-100/40 group-focus-within:text-uet-gold transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 text-white py-3 pr-12 pl-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-uet-gold focus:bg-white/10 transition-all font-medium text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-blue-100/40 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading || success}
              className={`w-full bg-uet-gold text-uet-navy py-4 mt-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-gold transition-all active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white'}`}
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
            
            <div className="relative flex items-center justify-center py-2 mt-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative bg-[#002366] px-4 text-xs tracking-widest text-blue-100/40 uppercase font-bold">Or</div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white text-slate-800 py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 transition-all active:scale-95 hover:bg-slate-50 mt-4"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>
          </form>

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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-uet-navy flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-uet-gold"></div></div>}>
      <RegisterContent />
    </Suspense>
  );
}
