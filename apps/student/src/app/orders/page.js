"use client";
import React, { useState, useEffect } from "react";
import { Navbar, ProtectedRoute } from "@uet-panda/shared-ui";
import { useAuthContext, db } from "@uet-panda/shared-config";
import { ref, query, orderByChild, equalTo, onValue } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  MapPin, 
  Clock, 
  Truck, 
  CheckCircle2, 
  Phone, 
  User, 
  Store, 
  Bike,
  ArrowRight,
  ChevronRight,
  Search,
  ShoppingBag,
  Star,
  MessageSquare,
  X
} from "lucide-react";
import { push, set } from "firebase/database";
import Link from "next/link";

const CAFE_NAMES = {
  cafe1: "Bhola",
  cafe2: "GSSC",
  cafe3: "BSSC",
  cafe4: "Aneexe",
};

const OrderTracking = () => {
  const { user } = useAuthContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
 
  const toggleOrderExpand = (orderId) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  useEffect(() => {
    if (!user) return;

    const ordersRef = ref(db, "orders");
    const q = query(ordersRef, orderByChild("userId"), equalTo(user.uid));
    
    const unsubscribe = onValue(q, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const o = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        // Sort by creation time
        o.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(o);
      } else {
        setOrders([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusStep = (status) => {
    switch (status) {
      case "Preparing": return 1;
      case "Out for Delivery": 
      case "Ready for Pickup": return 2;
      case "Delivered": 
      case "Collected": return 3;
      default: return 1;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-20">
      <Navbar />

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-poppins font-bold text-uet-navy tracking-tight text-center md:text-left">Active Orders</h1>
            <p className="text-slate-500 font-medium italic mt-1 text-center md:text-left text-sm md:text-base">Track your hunger in real-time</p>
          </div>
          <div className="flex items-center justify-center md:justify-end">
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm text-xs font-bold text-slate-400">
               <Search size={14} />
               <span>History synced with Cloud</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-uet-gold"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-16 text-center shadow-sm border border-slate-100 max-w-2xl mx-auto">
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
              <Package size={44} />
            </div>
            <h2 className="text-2xl font-bold text-uet-navy mb-2">No orders found</h2>
            <p className="text-slate-400 mb-8 max-w-xs mx-auto">You haven't placed any orders yet. Head to the homepage to start eating!</p>
            <Link 
              href="/" 
              className="inline-flex items-center space-x-2 bg-uet-navy text-white px-8 py-4 rounded-2xl font-bold shadow-navy hover:bg-uet-gold hover:text-uet-navy transition-all active:scale-95"
            >
              <span>Explore Menu</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            <AnimatePresence>
              {orders.map((order) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={order.id}
                  className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all group"
                >
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-uet-navy to-blue-900 text-white p-5 md:p-8 flex flex-row items-center justify-between gap-4">
                     <div className="flex items-center space-x-3 md:space-x-5">
                        <div className="bg-uet-gold p-2 md:p-3 rounded-xl md:rounded-2xl text-uet-navy shadow-gold shrink-0">
                           <Store size={18} className="md:w-5 md:h-5" />
                        </div>
                        <div className="min-w-0">
                           <div className="flex items-center space-x-2 mb-0.5">
                              <span className="text-[9px] uppercase font-bold text-blue-100/40 tracking-widest hidden sm:inline">Order Receipt</span>
                              <span className="bg-white/10 px-2 py-0.5 rounded text-[8px] md:text-[9px] font-bold text-uet-gold italic">#{order.id.slice(-6)}</span>
                           </div>
                           <h3 className="text-lg md:text-xl font-bold font-poppins truncate">
                              {CAFE_NAMES[order.cafeId] || order.cafeName || `Cafe ${order.cafeId}`}
                           </h3>
                        </div>
                     </div>
                     <div className="text-right shrink-0">
                        <p className="text-[9px] uppercase font-bold text-blue-100/40 tracking-widest mb-0.5">Total Amount</p>
                        <p className="text-xl md:text-2xl font-bold text-uet-gold">Rs. {order.total}</p>
                     </div>
                  </div>

                  {/* Progress Tracker */}
                  <div className="px-4 py-8 md:px-16 lg:px-24">
                     <div className="relative flex items-center justify-between max-w-sm mx-auto">
                        {/* Connecting Line */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-slate-100 -z-0">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${(getStatusStep(order.status) - 1) * 50}%` }}
                             className="h-full bg-uet-gold shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                           ></motion.div>
                        </div>
 
                        {/* Step 1: Preparing */}
                        <div className="relative z-10 flex flex-col items-center">
                           <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 ${getStatusStep(order.status) >= 1 ? 'bg-uet-gold text-uet-navy shadow-gold' : 'bg-white text-slate-300 border border-slate-200'}`}>
                              <Clock size={16} className="md:w-5 md:h-5" />
                           </div>
                           <span className={`mt-3 text-[8px] md:text-[10px] font-bold uppercase tracking-widest ${getStatusStep(order.status) >= 1 ? 'text-uet-navy' : 'text-slate-300'}`}>Preparing</span>
                        </div>
 
                        {/* Step 2: Transit/Ready */}
                        <div className="relative z-10 flex flex-col items-center">
                           <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 ${getStatusStep(order.status) >= 2 ? 'bg-uet-gold text-uet-navy shadow-gold' : 'bg-white text-slate-300 border border-slate-200'}`}>
                              {order.orderType === 'takeaway' ? <ShoppingBag size={16} className="md:w-5 md:h-5" /> : <Truck size={16} className="md:w-5 md:h-5" />}
                           </div>
                           <span className={`mt-3 text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-center max-w-[60px] md:max-w-none ${getStatusStep(order.status) >= 2 ? 'text-uet-navy' : 'text-slate-300'}`}>
                              {order.orderType === 'takeaway' ? 'Ready' : 'In Transit'}
                           </span>
                        </div>
 
                        {/* Step 3: Delivered/Collected */}
                        <div className="relative z-10 flex flex-col items-center">
                           <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 ${getStatusStep(order.status) >= 3 ? 'bg-uet-gold text-uet-navy shadow-gold font-bold' : 'bg-white text-slate-300 border border-slate-200'}`}>
                              <CheckCircle2 size={18} className="md:w-6 md:h-6" />
                           </div>
                           <span className={`mt-3 text-[8px] md:text-[10px] font-bold uppercase tracking-widest ${getStatusStep(order.status) >= 3 ? 'text-uet-navy' : 'text-slate-300'}`}>
                              {order.orderType === 'takeaway' ? 'Done' : 'Home'}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Mobile Expand Toggle */}
                  <button 
                    onClick={() => toggleOrderExpand(order.id)}
                    className="md:hidden w-full py-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] font-bold text-uet-gold uppercase tracking-widest active:scale-95 transition-all"
                  >
                    <span>{expandedOrders.has(order.id) ? "Hide Details" : "View Details"}</span>
                    <ChevronRight size={14} className={`transition-transform duration-300 ${expandedOrders.has(order.id) ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Rider & Item Details Breakdown - Collapsible on Mobile */}
                  <AnimatePresence>
                    {(expandedOrders.has(order.id) || (typeof window !== 'undefined' && window.innerWidth >= 768)) && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="bg-slate-50 p-6 md:p-10 flex flex-col lg:flex-row gap-8">
                           {/* Items */}
                           <div className="flex-grow">
                              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-4">Items Summary</p>
                              <div className="space-y-3">
                                 {order.items.map((item, idx) => (
                                   <div key={idx} className="flex flex-col gap-2">
                                      <div className="flex justify-between items-center group/item">
                                         <p className="text-uet-navy font-bold text-sm leading-tight flex items-center">
                                            <ChevronRight size={12} className="mr-2 text-uet-gold opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                            {item.quantity}x <span className="font-medium text-slate-600 ml-1">{item.name}</span>
                                         </p>
                                         <p className="text-slate-400 font-mono text-xs italic">Rs.{item.price * item.quantity}</p>
                                      </div>
                                      {(order.status === "Delivered" || order.status === "Collected") && (
                                        <button 
                                          onClick={() => {
                                            setSelectedItem(item);
                                            setCurrentOrder(order);
                                            setReviewModalOpen(true);
                                          }}
                                          className="self-start text-[10px] font-bold text-uet-gold hover:text-uet-navy flex items-center gap-1 transition-colors"
                                        >
                                          <Star size={10} className="fill-uet-gold" />
                                          Rate Item
                                        </button>
                                      )}
                                   </div>
                                 ))}
                              </div>
                           </div>
 
                           {/* Delivery/Takeaway Info */}
                           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 lg:w-[320px] shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-20 h-20 bg-uet-navy/5 rounded-full -mr-10 -mt-10"></div>
                              
                              <div className="relative z-10">
                                 {order.status === "Out for Delivery" && order.riderName ? (
                                   <div className="space-y-4">
                                      <div className="flex items-center space-x-3 mb-6">
                                         <div className="bg-uet-gold/10 p-2.5 rounded-2xl text-uet-gold">
                                            <Bike size={24} />
                                         </div>
                                         <div>
                                            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Your Rider</p>
                                            <h4 className="font-bold text-uet-navy">{order.riderName}</h4>
                                         </div>
                                      </div>
                                      <button className="w-full bg-uet-navy text-white py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 text-sm shadow-navy active:scale-95 transition-all">
                                         <Phone size={16} />
                                         <span>Contact: {order.riderPhone}</span>
                                      </button>
                                   </div>
                                 ) : order.status === "Delivered" || order.status === "Collected" ? (
                                   <div className="text-center py-4">
                                      <CheckCircle2 size={32} className="text-green-500 mx-auto mb-3" />
                                      <h4 className="font-bold text-uet-navy">Enjoy your meal!</h4>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Order Complete</p>
                                   </div>
                                 ) : order.orderType === 'takeaway' ? (
                                    <div className="space-y-4">
                                      <div className="flex items-center space-x-3 mb-2">
                                         <Store size={20} className="text-uet-gold" />
                                         <h4 className="font-bold text-uet-navy text-sm">Self-Pickup Order</h4>
                                      </div>
                                      <p className="text-xs text-slate-400 leading-relaxed italic">
                                        {order.status === "Ready for Pickup" 
                                          ? "Your order is ready at the counter! Please head to the cafe to collect it." 
                                          : "The cafe is preparing your food. We'll notify you when it's ready for pickup."}
                                      </p>
                                      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center space-x-2">
                                         <Store size={14} className="text-uet-gold" />
                                          <span className="text-[10px] font-bold text-slate-600 line-clamp-1">
                                            {CAFE_NAMES[order.cafeId] || order.cafeName || `Cafe ${order.cafeId}`} Counter
                                          </span>
                                      </div>
                                    </div>
                                  ) : (
                                   <div className="space-y-4">
                                     <div className="flex items-center space-x-3 mb-2">
                                        <Clock size={20} className="text-uet-gold" />
                                        <h4 className="font-bold text-uet-navy text-sm">Waiting to Dispatch</h4>
                                     </div>
                                     <p className="text-xs text-slate-400 leading-relaxed italic">The cafe is carefully preparing your food. We'll assign a rider soon.</p>
                                     <div className="mt-4 pt-4 border-t border-slate-50 flex items-center space-x-2">
                                        <MapPin size={14} className="text-red-400" />
                                        <span className="text-[10px] font-bold text-slate-600 line-clamp-1">{order.address}</span>
                                     </div>
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewModalOpen(false)}
              className="absolute inset-0 bg-uet-navy/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-poppins font-bold text-uet-navy">Rate your Meal</h3>
                    <p className="text-slate-400 text-sm font-medium mt-1">{selectedItem?.name}</p>
                  </div>
                  <button onClick={() => setReviewModalOpen(false)} className="bg-slate-50 p-2 rounded-xl text-slate-400 hover:text-uet-navy transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex justify-center gap-2 mb-8">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      onClick={() => setRating(star)}
                      className="transition-transform active:scale-90"
                    >
                      <Star 
                        size={32} 
                        className={`${rating >= star ? 'text-uet-gold fill-uet-gold' : 'text-slate-200'} transition-colors`} 
                      />
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Your Feedback (Optional)</label>
                    <textarea 
                      placeholder="How was the taste? Was it fresh? (Optional)"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-uet-gold min-h-[120px] transition-all"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>

                  <button 
                    disabled={submitting}
                    onClick={async () => {
                      setSubmitting(true);
                      try {
                        const reviewsRef = ref(db, "reviews");
                        const newReviewRef = push(reviewsRef);
                        await set(newReviewRef, {
                          orderId: currentOrder.id,
                          itemId: selectedItem.id || selectedItem.name, 
                          itemName: selectedItem.name,
                          cafeId: currentOrder.cafeId,
                          userId: user.uid,
                          userName: user.displayName || (user.email ? user.email.split('@')[0].split(/[._]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : "Student"),
                          userEmail: user.email || "",
                          rating,
                          comment,
                          createdAt: new Date().toISOString()
                        });
                        setReviewModalOpen(false);
                        setComment("");
                        setRating(5);
                      } catch (err) {
                        console.error("Review Error:", err);
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    className="w-full bg-uet-navy text-white py-4 rounded-2xl font-bold shadow-navy hover:bg-uet-gold hover:text-uet-navy transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <MessageSquare size={18} />
                        Submit Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default function ProtectedOrderTrackingPage() {
  return (
    <ProtectedRoute>
      <OrderTracking />
    </ProtectedRoute>
  );
}
