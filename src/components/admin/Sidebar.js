"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  BarChart3, 
  Settings, 
  LogOut, 
  ChevronRight,
  Store
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/config";
import { useAuthContext } from "@/context/AuthContext";

const Sidebar = () => {
  const pathname = usePathname();
  const { cafeId } = useAuthContext();

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Inventory", icon: <Package size={20} />, path: "/dashboard/inventory" },
    { name: "Orders", icon: <ShoppingBag size={20} />, path: "/dashboard/orders" },
    { name: "Analytics", icon: <BarChart3 size={20} />, path: "/dashboard/analytics" },
  ];

  const handleLogout = () => signOut(auth);

  return (
    <aside className="w-64 bg-uet-navy text-white min-h-screen flex flex-col shadow-2xl">
      <div className="p-8 border-b border-white/10 flex items-center space-x-3">
        <div className="bg-uet-gold p-2 rounded-xl">
          <Store className="text-uet-navy" size={24} />
        </div>
        <div>
           <h2 className="font-poppins font-bold text-lg leading-tight uppercase tracking-tighter">Admin <span className="text-uet-gold">Panda</span></h2>
           <p className="text-[10px] text-blue-100/40 uppercase font-bold tracking-widest">{cafeId || 'Cafe Panel'}</p>
        </div>
      </div>

      <nav className="flex-grow p-4 mt-6 space-y-2">
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${
              pathname === item.path 
              ? "bg-uet-gold text-uet-navy shadow-gold translate-x-1" 
              : "hover:bg-white/5 text-blue-100/60 hover:text-white"
            }`}
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              <span className="font-bold text-sm tracking-wide">{item.name}</span>
            </div>
            <ChevronRight size={16} className={`transition-transform ${pathname === item.path ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`} />
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
