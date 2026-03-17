"use client";
import React, { useState, useEffect, useMemo } from "react";
import { db } from "@uet-panda/shared-config";
import { ref, onValue } from "firebase/database";
import { 
  BarChart3, 
  ShoppingBag, 
  Truck, 
  Calendar, 
  Store,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowRight,
  LogOut,
  TrendingUp,
  PackageCheck,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  Shield,
  Key
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const CAFES = [
  { id: "all", name: "All Cafes" },
  { id: "cafe1", name: "Bhola" },
  { id: "cafe2", name: "GSSC" },
  { id: "cafe3", name: "BSSC" },
  { id: "cafe4", name: "Aneexe" },
];

const TIME_RANGES = [
  { id: "today", label: "Today" },
  { id: "7days", label: "Last 7 Days" },
  { id: "30days", label: "Last 30 Days" },
  { id: "month", label: "Custom Month" },
  { id: "date", label: "Specific Date" },
];

export default function SuperAdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCafe, setSelectedCafe] = useState("all");
  const [timeRange, setTimeRange] = useState("today");
  const [orderType, setOrderTypeFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Credentials App State
  const [cafeCreds, setCafeCreds] = useState({});
  const [savingCred, setSavingCred] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState({});
  const [editedPasswords, setEditedPasswords] = useState({});
  const router = useRouter();

  useEffect(() => {
    const ordersRef = ref(db, "orders");
    const unsub = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setOrders(list);
      } else {
        setOrders([]);
      }
      setLoading(false);
    });
    
    // Add real-time listener for credentials
    const credsRef = ref(db, "cafe_credentials");
    const unsubCreds = onValue(credsRef, (snapshot) => {
      setCafeCreds(snapshot.val() || {});
    });

    return () => {
      unsub();
      unsubCreds();
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth");
    router.refresh();
  };

  const filteredData = useMemo(() => {
    let filtered = orders;

    // Filter by Cafe
    if (selectedCafe !== "all") {
      filtered = filtered.filter(o => o.cafeId === selectedCafe);
    }

    // Filter by Order Type
    if (orderType !== "all") {
      filtered = filtered.filter(o => {
        const actualType = o.orderType === 'takeaway' ? 'takeaway' : 'delivery';
        const targetType = (orderType === 'preorder' ? 'takeaway' : 'delivery');
        return actualType === targetType;
      });
    }

    // Filter by Time
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    filtered = filtered.filter(o => {
      const orderDate = new Date(o.createdAt);
      
      switch (timeRange) {
        case "today":
          return orderDate >= today;
        case "7days":
          const last7 = new Date();
          last7.setDate(today.getDate() - 7);
          return orderDate >= last7;
        case "30days":
          const last30 = new Date();
          last30.setDate(today.getDate() - 30);
          return orderDate >= last30;
        case "date":
          return o.createdAt.split('T')[0] === selectedDate;
        case "month":
          return o.createdAt.startsWith(selectedMonth);
        default:
          return true;
      }
    });

    return filtered;
  }, [orders, selectedCafe, timeRange, selectedDate, selectedMonth, orderType]);

  const handleSaveCredential = async (cafeId, email) => {
    // Determine the final password to send
    // If they haven't typed anything, editedPasswords[cafeId] might be undefined.
    // If so, we use the original password to override, but logically we only want to submit if changed.
    const originalPassword = cafeCreds[cafeId]?.password;
    const newPassword = editedPasswords[cafeId] !== undefined ? editedPasswords[id] : undefined;
    
    const finalPassword = editedPasswords[cafeId] !== undefined ? editedPasswords[cafeId] : originalPassword;

    if (!finalPassword || finalPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    
    setSavingCred(cafeId);
    try {
      const res = await fetch("/api/updateCafeCredentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cafeId, email, newPassword: finalPassword })
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccessMsg(cafeId);
        setTimeout(() => setSuccessMsg(""), 3000);
        // Clear the edit state so it falls back to showing the DB state implicitly
        setEditedPasswords(prev => ({...prev, [cafeId]: undefined}));
      } else {
        alert("Failed: " + data.error);
      }
    } catch(e) {
      alert("Error saving password");
    } finally {
      setSavingCred("");
    }
  };

  const stats = useMemo(() => {
    const delivery = filteredData.filter(o => (o.orderType || 'delivery') !== 'takeaway');
    const preOrder = filteredData.filter(o => o.orderType === 'takeaway');
    
    const totalRev = filteredData.reduce((sum, o) => sum + (o.total || 0), 0);
    const delRev = delivery.reduce((sum, o) => sum + (o.total || 0), 0);
    const preRev = preOrder.reduce((sum, o) => sum + (o.total || 0), 0);

    // Item-wise breakdown
    const itemStats = {};
    filteredData.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const key = item.name;
          if (!itemStats[key]) {
            itemStats[key] = { qty: 0, revenue: 0, name: item.name };
          }
          const q = Number(item.quantity) || 1;
          const p = Number(item.price) || 0;
          itemStats[key].qty += q;
          itemStats[key].revenue += (p * q);
        });
      }
    });

    return {
      total: filteredData.length,
      deliveryCount: delivery.length,
      preOrderCount: preOrder.length,
      totalRevenue: totalRev,
      deliveryRev: delRev,
      preOrderRev: preRev,
      items: Object.values(itemStats).sort((a, b) => b.qty - a.qty)
    };
  }, [filteredData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-uet-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-uet-navy p-2 rounded-xl text-uet-gold">
                <BarChart3 size={24} />
              </div>
              <h1 className="text-3xl font-poppins font-bold text-uet-navy tracking-tight">Super Admin Dashboard</h1>
            </div>
            <p className="text-slate-500 font-medium">Independent Cafe Sales & Performance Tracking</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-white text-uet-navy font-bold rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-sm"
          >
            <LogOut size={16} />
            Logout Securely
          </button>
        </header>

        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">Cafe Filter</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <select 
                value={selectedCafe}
                onChange={(e) => setSelectedCafe(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-uet-navy focus:ring-1 focus:ring-uet-gold outline-none appearance-none cursor-pointer"
              >
                {CAFES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">Time Range</label>
             <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-uet-navy focus:ring-1 focus:ring-uet-gold outline-none appearance-none cursor-pointer"
              >
                {TIME_RANGES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">Order Type</label>
             <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <select 
                value={orderType}
                onChange={(e) => setOrderTypeFilter(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-uet-navy focus:ring-1 focus:ring-uet-gold outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="preorder">Pre-Order Only</option>
                <option value="delivery">Delivery Only</option>
              </select>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {timeRange === 'date' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm"
              >
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">Specific Date</label>
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-uet-navy focus:ring-1 focus:ring-uet-gold outline-none"
                />
              </motion.div>
            )}
            {timeRange === 'month' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm"
              >
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">Full Month</label>
                <input 
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-uet-navy focus:ring-1 focus:ring-uet-gold outline-none"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-uet-navy p-8 rounded-[2.5rem] shadow-navy text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
            <p className="text-blue-100/40 text-[10px] font-bold uppercase tracking-widest mb-1">Total Revenue</p>
            <h3 className="text-3xl font-bold tracking-tight">Rs. {stats.totalRevenue}</h3>
            <div className="mt-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-uet-gold">
               <span>Across {stats.total} Orders</span>
               <TrendingUp size={14} />
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="bg-orange-50 p-5 rounded-3xl text-orange-600">
              <ShoppingBag size={28} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Pre-Orders (Takeaway)</p>
              <h3 className="text-2xl font-bold text-uet-navy">{stats.preOrderCount}</h3>
              <p className="text-xs font-bold text-slate-400 mt-1">Rs. {stats.preOrderRev}</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="bg-blue-50 p-5 rounded-3xl text-blue-600">
              <Truck size={28} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Delivery Orders</p>
              <h3 className="text-2xl font-bold text-uet-navy">{stats.deliveryCount}</h3>
              <p className="text-xs font-bold text-slate-400 mt-1">Rs. {stats.deliveryRev}</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
             <div className="bg-green-50 p-5 rounded-3xl text-green-600">
               <PackageCheck size={28} />
             </div>
             <div>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Unique Items Sold</p>
               <h3 className="text-2xl font-bold text-uet-navy">{stats.items.length}</h3>
               <p className="text-xs font-bold text-slate-400 mt-1">Varieties</p>
             </div>
          </div>
        </div>

        {/* Detailed Items Table */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-poppins font-bold text-uet-navy flex items-center gap-3">
                <Search size={20} className="text-uet-gold" />
                Item Performance Breakdown
             </h3>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Showing {stats.items.length} products
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="pb-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">Menu Item</th>
                  <th className="pb-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 text-center">Qty Sold</th>
                  <th className="pb-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.items.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-20 text-center text-slate-400 font-medium italic">
                      No sales recorded for the selected period.
                    </td>
                  </tr>
                ) : (
                  stats.items.map((item, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={item.name} 
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-uet-navy group-hover:bg-uet-gold transition-colors">
                              <span className="font-bold text-xs">{idx + 1}</span>
                           </div>
                           <span className="font-bold text-uet-navy">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-uet-navy">
                          {item.qty} units
                        </span>
                      </td>
                      <td className="py-6 px-4 text-right">
                        <span className="font-mono font-bold text-uet-navy">Rs. {item.revenue}</span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manage Cafe Access Credentials section */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm mt-10">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-poppins font-bold text-uet-navy flex items-center gap-3">
                <Shield size={20} className="text-uet-gold" />
                Manage Cafe Access Credentials
             </h3>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Partner Security Settings
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="pb-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">Cafe Partner</th>
                  <th className="pb-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">Login Email</th>
                  <th className="pb-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">Password</th>
                  <th className="pb-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Object.entries(cafeCreds).map(([id, cred]) => (
                  <tr key={id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <Store size={18} />
                         </div>
                         <div className="flex flex-col">
                            <span className="font-bold text-uet-navy">{cred.name || id}</span>
                            <span className="text-xs text-slate-400">ID: {id}</span>
                         </div>
                      </div>
                    </td>
                    <td className="py-6 px-4">
                      <span className="font-medium text-slate-600">{cred.email}</span>
                    </td>
                    <td className="py-6 px-4 max-w-[250px]">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-300">
                           <Key size={14} />
                        </div>
                        <input 
                           type={showPassword[id] ? "text" : "password"}
                           placeholder="Enter new password"
                           value={editedPasswords[id] !== undefined ? editedPasswords[id] : cred.password}
                           onChange={(e) => setEditedPasswords(prev => ({...prev, [id]: e.target.value}))}
                           className="w-full bg-slate-100 border-none text-sm font-bold text-uet-navy py-2 pl-9 pr-10 rounded-xl focus:ring-1 focus:ring-uet-gold outline-none"
                        />
                        <button 
                           onClick={() => setShowPassword(prev => ({...prev, [id]: !prev[id]}))}
                           className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-uet-gold"
                        >
                           {showPassword[id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="py-6 px-4 text-right">
                       <button
                         onClick={() => handleSaveCredential(id, cred.email)}
                         disabled={savingCred === id}
                         className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm min-w-[120px] ${
                           successMsg === id 
                             ? 'bg-green-500 text-white' 
                             : 'bg-uet-navy text-white hover:bg-uet-gold hover:text-uet-navy'
                         }`}
                       >
                         {savingCred === id ? (
                           <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                         ) : successMsg === id ? (
                           <><CheckCircle2 size={16} /> Saved!</>
                         ) : (
                           <><Save size={16} /> Update</>
                         )}
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
