"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@uet-panda/shared-config";
import { ref, get } from "firebase/database";
import { motion } from "framer-motion";
import { Mail, Lock, Store, ArrowRight, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function AdminLoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard/orders";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Explicitly check role before redirecting to prevent loops
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists() && snapshot.val().role === "admin") {
        router.push(redirectUrl);
      } else {
        await auth.signOut();
        setError("Unauthorized access. This portal is for Cafe Partners only.");
      }
    } catch (err) {
      console.error("[Admin Login] Sign-in failed:", err);
      setError("Invalid credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-uet-navy flex items-center justify-center p-4 overflow-hidden relative">
      {/* Structural Professional Background */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,35,102,1)_0%,rgba(0,20,60,1)_100%)]"></div>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-uet-gold/5 rounded-full -mr-32 -mt-32 blur-[120px]"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="flex flex-col md:flex-row bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[500px]">
          
          {/* Left Side: Branding Info */}
          <div className="hidden md:flex md:w-5/12 bg-uet-gold/90 p-10 flex-col justify-between relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
             <div>
                <Link href="/" className="inline-flex items-center gap-2 text-uet-navy font-bold text-sm mb-12 hover:translate-x-1 transition-transform">
                   <ArrowLeft size={16} />
                   Back to Site
                </Link>
                <div className="mb-6">
                   <img src="/logo.png" alt="Logo" style={{ width: '130px', height: 'auto' }} />
                </div>
                {/* 
                <div className="p-4 bg-uet-navy rounded-2xl inline-block shadow-lg mb-6">
                   <Store size={32} className="text-uet-gold" />
                </div>
                */}
                <h2 className="text-3xl font-poppins font-extrabold text-uet-navy tracking-tight leading-tight">
                   Merchant <br/>
                   <span className="text-white">Portal</span>
                </h2>
             </div>
             <p className="text-uet-navy/70 text-xs font-bold uppercase tracking-widest leading-relaxed">
                Secure management for <br/>
                UET Panda partners
             </p>
          </div>

          {/* Right Side: Login Form */}
          <div className="flex-grow p-8 md:p-12 flex flex-col justify-center">
             <div className="mb-8">
                <div className="md:hidden flex justify-center mb-6">
                   <img src="/logo.png" alt="Logo" style={{ width: '130px', height: 'auto' }} />
                   {/* 
                   <div className="bg-uet-gold p-4 rounded-2xl">
                      <Store size={28} className="text-uet-navy" />
                   </div>
                   */}
                </div>
                <h1 className="text-2xl font-poppins font-bold text-white mb-2">Partner Login</h1>
                <p className="text-blue-100/40 text-sm font-medium">Access your orders & inventory</p>
             </div>

             {error && (
               <motion.div 
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-xl mb-6 flex items-center gap-3"
               >
                 <AlertCircle size={18} className="text-red-400 shrink-0" />
                 <p className="text-xs font-bold leading-tight">{error}</p>
               </motion.div>
             )}

             <form onSubmit={handleLogin} className="space-y-5">
               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-uet-gold uppercase tracking-[0.2em] ml-1">Work Email</label>
                 <div className="relative group">
                   <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-uet-gold transition-colors">
                     <Mail size={18} />
                   </div>
                   <input 
                     type="email" 
                     required
                     className="w-full bg-white/5 border border-white/10 text-white py-4 pl-12 pr-4 rounded-2xl focus:outline-none focus:ring-1 focus:ring-uet-gold transition-all font-medium"
                     placeholder="admin@cafe.uet.edu.pk"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                   />
                 </div>
               </div>

               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-uet-gold uppercase tracking-[0.2em] ml-1">Password</label>
                 <div className="relative group">
                   <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-uet-gold transition-colors">
                     <Lock size={18} />
                   </div>
                   <input 
                     type={showPassword ? "text" : "password"} 
                     required
                     className="w-full bg-white/5 border border-white/10 text-white py-4 pl-12 pr-12 rounded-2xl focus:outline-none focus:ring-1 focus:ring-uet-gold transition-all font-medium"
                     placeholder="••••••••"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                   />
                   <button 
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute inset-y-0 right-4 flex items-center text-white/20 hover:text-uet-gold transition-colors"
                   >
                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                   </button>
                 </div>
               </div>

               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full bg-uet-gold hover:bg-white text-uet-navy py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
               >
                 {loading ? (
                   <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-uet-navy"></div>
                 ) : (
                   <>
                     <span>Authorized Access</span>
                     <ArrowRight size={18} />
                   </>
                 )}
               </button>
             </form>

             <div className="mt-8 pt-8 border-t border-white/5 text-center md:hidden">
                <Link href="/" className="text-uet-gold/60 text-xs font-bold hover:text-uet-gold transition-colors">
                   ← Return to Student Website
                </Link>
             </div>
          </div>
        </div>
        
        {/* Footer Support Detail */}
        <p className="text-center mt-8 text-blue-100/20 text-[10px] font-bold uppercase tracking-[0.3em]">
           Property of UET Panda — Authorized Use Only
        </p>
      </motion.div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-uet-navy flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-uet-gold"></div></div>}>
      <AdminLoginContent />
    </Suspense>
  );
}
