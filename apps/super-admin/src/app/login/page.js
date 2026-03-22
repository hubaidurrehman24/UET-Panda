"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

export default function SuperAdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        router.push("/dashboard");
      } else {
        setError("Invalid Super Admin credentials.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-uet-navy flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-uet-gold/5 rounded-full -mr-40 -mt-40 blur-[150px]"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full -ml-32 -mb-32 blur-[100px]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 shadow-2xl">
          <div className="text-center mb-10">
            <img src="/logo.png" alt="Logo" style={{ width: '130px', height: 'auto' }} className="mx-auto mb-6" />
            {/* 
            <div className="inline-flex p-4 bg-uet-gold rounded-2xl shadow-gold mb-6">
              <ShieldCheck size={32} className="text-uet-navy" />
            </div>
            <h1 className="text-3xl font-poppins font-bold text-white tracking-tight">Super Admin</h1>
            */}
            <p className="text-blue-100/40 text-sm font-medium mt-2">Centralized Statistics Hub</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-2xl mb-8 flex items-center gap-3"
            >
              <AlertCircle size={18} className="text-red-400 shrink-0" />
              <p className="text-xs font-bold">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-uet-gold uppercase tracking-[0.2em] ml-2">Access Portal ID</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-uet-gold transition-colors" size={18} />
                <input 
                  type="text"
                  required
                  placeholder="Username"
                  className="w-full bg-white/5 border border-white/10 text-white py-4 pl-12 pr-4 rounded-2xl focus:outline-none focus:ring-1 focus:ring-uet-gold transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-uet-gold uppercase tracking-[0.2em] ml-2">Secure Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-uet-gold transition-colors" size={18} />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 text-white py-4 pl-12 pr-4 rounded-2xl focus:outline-none focus:ring-1 focus:ring-uet-gold transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-uet-gold hover:bg-white text-uet-navy py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-uet-navy/20 border-t-uet-navy rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Enter Dashboard</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-12 text-blue-100/10 text-[9px] font-bold uppercase tracking-[0.4em]">
            Authorized Personnel Only
          </p>
        </div>
      </motion.div>
    </div>
  );
}
