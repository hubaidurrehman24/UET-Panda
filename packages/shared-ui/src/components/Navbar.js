"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, User, LogOut, Search, ClipboardList } from "lucide-react";
import { useAuthContext, useCartContext, auth } from "@uet-panda/shared-config";
import { signOut } from "firebase/auth";

const Navbar = () => {
  const pathname = usePathname();
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
    <nav className="sticky top-0 bg-uet-navy text-white shadow-navy border-b border-white/10" style={{ zIndex: 9999 }}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img src="/logo.png" alt="Logo" style={{ width: '130px', height: 'auto' }} className="hover:scale-105 transition-transform" />
          {/* 
          <span className="font-poppins font-bold text-xl tracking-tight">
            UET <span className="text-uet-gold">PANDA</span>
          </span>
          */}
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {pathname === '/' && (
            <>
              <button onClick={() => document.getElementById('cafes')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-uet-gold transition-colors font-medium">Cafes</button>
              <button onClick={() => document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-uet-gold transition-colors font-medium">Deals</button>
            </>
          )}
          {userRole === 'admin' && (
            <Link href="/dashboard" className="bg-uet-gold text-uet-navy px-4 py-1.5 rounded-full font-bold hover:bg-white transition-all shadow-sm">
              Admin Dashboard
            </Link>
          )}
        </div>

        {/* Icons */}
        <div className="flex items-center space-x-4">
          {user && userRole === 'student' && (
            <Link href="/orders" className="flex items-center gap-1 hover:text-uet-gold transition-colors font-bold mr-2 text-[10px] sm:text-sm">
              <ClipboardList size={16} className="md:hidden" />
              <span>My Orders</span>
            </Link>
          )}

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
