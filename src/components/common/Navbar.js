"use client";
import React from "react";
import Link from "next/link";
import { ShoppingCart, User, LogOut, Search } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useCartContext } from "@/context/CartContext";
import { auth } from "@/firebase/config";
import { signOut } from "firebase/auth";

const Navbar = () => {
  const { user, userRole } = useAuthContext();
  const { cart } = useCartContext();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-uet-navy text-white shadow-navy border-b border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="bg-uet-gold p-1.5 rounded-lg">
            <span className="text-uet-navy font-bold text-xl tracking-tighter">P</span>
          </div>
          <span className="font-poppins font-bold text-xl tracking-tight hidden sm:block">
            UET <span className="text-uet-gold">PANDA</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/" className="hover:text-uet-gold transition-colors font-medium">Home</Link>
          {user && userRole === 'student' && (
            <Link href="/orders" className="hover:text-uet-gold transition-colors font-medium">My Orders</Link>
          )}
          {userRole === 'admin' && (
            <Link href="/dashboard" className="bg-uet-gold text-uet-navy px-4 py-1.5 rounded-full font-bold hover:bg-white transition-all shadow-sm">
              Admin Dashboard
            </Link>
          )}
        </div>

        {/* Icons */}
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <Link href="/cart" className="p-2 hover:bg-white/10 rounded-full transition-colors block">
              <ShoppingCart size={22} className="text-uet-gold" />
              {cart.length > 0 && (
                <span className="absolute -top-0 -right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Link>
          </div>

          {user ? (
            <div className="flex items-center space-x-3 ml-2 pl-4 border-l border-white/20">
              <p className="hidden md:block text-xs font-medium text-uet-gold/80">
                {user.email?.split('@')[0]}
              </p>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-red-400"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="flex items-center space-x-1 pl-4 border-l border-white/20 hover:text-uet-gold transition-colors"
            >
              <User size={22} />
              <span className="hidden sm:inline font-medium">Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
