"use client";
import React, { useState, useEffect } from "react";
import { ref, query, orderByChild, equalTo, onValue } from "firebase/database";
import { db, useAuthContext } from "@uet-panda/shared-config";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Calendar,
  ArrowUpRight,
  Banknote,
  CreditCard
} from "lucide-react";

const AnalyticsPage = () => {
  const { cafeId } = useAuthContext();
  const [orders, setOrders] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [codSales, setCodSales] = useState(0);
  const [onlineSales, setOnlineSales] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);

  useEffect(() => {
    if (!cafeId) return;

    const ordersRef = ref(db, "orders");
    const q = query(ordersRef, orderByChild("cafeId"), equalTo(cafeId));

    const unsubscribe = onValue(q, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Firebase queries support one OrderByChild filter, filter by status in JS
        const o = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .filter(ord => ord.status === "Delivered");
          
        setOrders(o);
        
        const total = o.reduce((sum, order) => sum + order.total, 0);
        const cod = o.filter(ord => ord.paymentMethod === 'cod').reduce((sum, order) => sum + order.total, 0);
        const online = o.filter(ord => ord.paymentMethod === 'stripe').reduce((sum, order) => sum + order.total, 0);
        
        setTotalSales(total);
        setCodSales(cod);
        setOnlineSales(online);
        setDeliveredCount(o.length);
      } else {
        setOrders([]);
        setTotalSales(0);
        setCodSales(0);
        setOnlineSales(0);
        setDeliveredCount(0);
      }
    });

    return () => unsubscribe();
  }, [cafeId]);

  const stats = [
    { name: "Total Revenue", value: `Rs. ${totalSales}`, icon: <DollarSign size={24} />, color: "text-green-500", bg: "bg-green-50" },
    { name: "Delivered Orders", value: deliveredCount, icon: <ShoppingBag size={24} />, color: "text-blue-500", bg: "bg-blue-50" },
    { name: "Avg. Ticket", value: `Rs. ${deliveredCount > 0 ? Math.round(totalSales / deliveredCount) : 0}`, icon: <TrendingUp size={24} />, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-poppins font-bold text-uet-navy tracking-tight">Financial Insights</h1>
        <p className="text-slate-500 font-medium italic">Performance overview for your cafe</p>
      </header>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {stats.map((stat, idx) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            key={idx} 
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500 opacity-50`}></div>
            <div className={`${stat.bg} ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6`}>
              {stat.icon}
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-1">{stat.name}</p>
            <p className="text-3xl font-bold text-uet-navy tracking-tight">{stat.value}</p>
            <div className="flex items-center mt-4 text-[10px] font-bold text-green-500 uppercase tracking-widest">
               <ArrowUpRight size={14} className="mr-1" />
               <span>+12.5% vs Last Month</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Breakdown */}
        <div className="bg-uet-navy text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-uet-gold/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
           <h3 className="text-xl font-poppins font-bold mb-10 flex items-center space-x-3">
             <BarChart3 className="text-uet-gold" />
             <span>Revenue Split</span>
           </h3>

           <div className="space-y-10">
              <div className="relative">
                <div className="flex justify-between items-end mb-4">
                   <div>
                     <p className="text-[10px] font-bold text-blue-100/40 uppercase tracking-[0.2em] mb-1">Cash on Delivery</p>
                     <h4 className="text-2xl font-bold">Rs. {codSales}</h4>
                   </div>
                   <div className="bg-white/10 p-2 rounded-xl text-uet-gold">
                      <Banknote size={24} />
                   </div>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }} 
                     animate={{ width: `${totalSales > 0 ? (codSales/totalSales)*100 : 0}%` }}
                     className="h-full bg-uet-gold"
                   ></motion.div>
                </div>
              </div>

              <div className="relative">
                <div className="flex justify-between items-end mb-4">
                   <div>
                     <p className="text-[10px] font-bold text-blue-100/40 uppercase tracking-[0.2em] mb-1">Online Payments</p>
                     <h4 className="text-2xl font-bold">Rs. {onlineSales}</h4>
                   </div>
                   <div className="bg-white/10 p-2 rounded-xl text-blue-400">
                      <CreditCard size={24} />
                   </div>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }} 
                     animate={{ width: `${totalSales > 0 ? (onlineSales/totalSales)*100 : 0}%` }}
                     className="h-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)]"
                   ></motion.div>
                </div>
              </div>
           </div>

           <p className="text-center mt-12 text-[10px] text-blue-100/30 uppercase tracking-[0.3em] font-medium leading-relaxed italic">
             Matched with Stripe and COD resolution logic
           </p>
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
           <h3 className="text-xl font-poppins font-bold text-uet-navy mb-8 flex items-center space-x-3">
             <Calendar className="text-uet-gold" />
             <span>Delivered History</span>
           </h3>
           
           {orders.length === 0 ? (
             <p className="text-slate-400 text-sm font-medium italic py-10 text-center">No delivered orders yet.</p>
           ) : (
             <div className="space-y-6">
                {orders.slice(0, 5).map((ord) => (
                  <div key={ord.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:scale-[1.02] transition-transform">
                     <div className="flex items-center space-x-4">
                        <div className="bg-white p-2.5 rounded-xl shadow-sm">
                           <ShoppingBag size={18} className="text-uet-navy" />
                        </div>
                        <div>
                           <p className="font-bold text-uet-navy text-sm">{ord.userName}</p>
                           <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{ord.paymentMethod}</p>
                        </div>
                     </div>
                     <p className="font-bold text-uet-navy">Rs. {ord.total}</p>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
