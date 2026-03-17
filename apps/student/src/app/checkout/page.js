"use client";
import React, { useState } from "react";
import { Navbar, ProtectedRoute } from "@uet-panda/shared-ui";
import { useCartContext, useAuthContext, db } from "@uet-panda/shared-config";
import { ref, push, set } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, User, CreditCard, Banknote, CheckCircle2, ArrowRight, Loader2, Truck, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

const CAFE_NAMES = {
  cafe1: "Bhola",
  cafe2: "GSSC",
  cafe3: "BSSC",
  cafe4: "Aneexe",
};

const CheckoutPage = () => {
  const { cart, cartTotal, getSplitOrders, clearCart } = useCartContext();
  const { user } = useAuthContext();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod"); // 'cod' or 'stripe'
  const [orderType, setOrderType] = useState("delivery"); // 'delivery' or 'takeaway'
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [showStripeMock, setShowStripeMock] = useState(false);
  const router = useRouter();

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to place an order.");
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!/^03\d{9}$/.test(phone)) {
      alert("Please enter a valid 11-digit Pakistani phone number starting with 03 (e.g., 03001234567)");
      return;
    }

    if (paymentMethod === "stripe" && !showStripeMock) {
      setShowStripeMock(true);
      return;
    }

    setLoading(true);
    const splitOrders = getSplitOrders();
    const orderIds = [];

    try {
      // Create separate orders for each cafe
      for (const cafeId in splitOrders) {
        const items = splitOrders[cafeId];
        const cafeTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const orderData = {
          userId: user.uid,
          userName: name,
          userEmail: user.email,
          userPhone: phone,
          address: orderType === 'takeaway' ? "Self-Pickup at Cafe" : address,
          orderType: orderType,
          cafeId: cafeId,
          cafeName: CAFE_NAMES[cafeId] || items[0].cafeName || `Cafe ${cafeId}`,
          items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          total: cafeTotal,
          status: "Preparing", // Preparing -> Out for Delivery -> Delivered
          paymentMethod: paymentMethod,
          isPaid: paymentMethod === 'stripe', // Online is paid immediately
          createdAt: new Date().toISOString(),
          riderName: "",
          riderPhone: "",
        };

        const newOrderRef = push(ref(db, "orders"));
        await set(newOrderRef, orderData);
        orderIds.push(newOrderRef.key);
      }

      setOrderComplete(true);
      clearCart();
      setTimeout(() => {
        router.push("/"); // Redirect after success
      }, 3000);

    } catch (error) {
      console.error("Error creating order: ", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-uet-navy flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/10 backdrop-blur-xl p-10 rounded-[3rem] text-center max-w-sm border border-white/20"
        >
          <div className="bg-uet-gold w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-gold">
            <CheckCircle2 size={40} className="text-uet-navy" />
          </div>
          <h2 className="text-2xl font-poppins font-bold text-white mb-2">Order Placed!</h2>
          <p className="text-blue-100/60 font-medium italic">Your multi-cafe orders have been submitted. Track them in your profile.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-20">
      <Navbar />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="mb-10 text-center">
            <h1 className="text-3xl font-poppins font-bold text-uet-navy">{showStripeMock ? "Online Payment" : "Secure Checkout"}</h1>
            <p className="text-slate-500 mt-2 font-medium">{showStripeMock ? "Mock Stripe Integration" : "Split billing logic will generate separate receipts"}</p>
        </header>

        {showStripeMock ? (
          <div className="max-w-md mx-auto bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-poppins font-bold text-uet-navy">Card Details</h3>
                <CreditCard size={24} className="text-uet-gold" />
             </div>
             
             <div className="space-y-4">
               <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Card Number</label>
                  <input type="text" placeholder="4242 4242 4242 4242" className="w-full bg-slate-50 border-none outline-none p-3.5 rounded-2xl text-uet-navy font-medium font-mono" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Expiry</label>
                    <input type="text" placeholder="MM/YY" className="w-full bg-slate-50 border-none outline-none p-3.5 rounded-2xl text-uet-navy font-medium font-mono" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">CVC</label>
                    <input type="text" placeholder="123" className="w-full bg-slate-50 border-none outline-none p-3.5 rounded-2xl text-uet-navy font-medium font-mono" />
                  </div>
               </div>
               
               <div className="pt-6 border-t border-slate-100 mt-6 flex gap-4">
                 <button 
                    type="button" 
                    onClick={() => setShowStripeMock(false)}
                    className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleCheckout}
                    disabled={loading}
                    className="flex-1 bg-uet-navy text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-navy transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <span>Pay Rs. {cartTotal}</span>}
                  </button>
               </div>
             </div>
          </div>
        ) : (
        <form onSubmit={handleCheckout} className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* User Details */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
               <h3 className="text-lg font-bold text-uet-navy mb-6 flex items-center space-x-2">
                 <User size={20} className="text-uet-gold" />
                 <span>Delivery Details</span>
               </h3>

               <div className="space-y-4">
                 <div>
                   <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                   <input 
                     type="text" required
                     placeholder="John Doe"
                     className="w-full bg-slate-50 border-none outline-none p-3.5 rounded-2xl text-uet-navy font-medium focus:ring-2 focus:ring-uet-gold transition-all"
                     value={name} onChange={(e) => setName(e.target.value)}
                   />
                 </div>
                 <div>
                   <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                   <input 
                     type="tel" required
                     placeholder="03XX-XXXXXXX"
                     className="w-full bg-slate-50 border-none outline-none p-3.5 rounded-2xl text-uet-navy font-medium focus:ring-2 focus:ring-uet-gold transition-all"
                     value={phone} onChange={(e) => setPhone(e.target.value)}
                   />
                 </div>
                 <div>
                   <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">
                     {orderType === 'takeaway' ? 'Pre Order Pickup Info (Optional)' : 'UET Hostel/Dept/Room'}
                   </label>
                   <textarea 
                     required={orderType === 'delivery'} rows="3"
                     placeholder={orderType === 'takeaway' ? "e.g. I will pick up from counter" : "e.g. Room 45, Zubair Hall"}
                     className="w-full bg-slate-50 border-none outline-none p-3.5 rounded-2xl text-uet-navy font-medium focus:ring-2 focus:ring-uet-gold transition-all resize-none"
                     value={address} onChange={(e) => setAddress(e.target.value)}
                   />
                 </div>
               </div>
            </div>

            {/* Order Type */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
               <h3 className="text-lg font-bold text-uet-navy mb-6 flex items-center space-x-2">
                 <Truck size={20} className="text-uet-gold" />
                 <span>Order Type</span>
               </h3>

               <div className="grid grid-cols-2 gap-4">
                 <button 
                   type="button"
                   onClick={() => setOrderType("delivery")}
                   className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                     orderType === 'delivery' 
                     ? "border-uet-gold bg-uet-gold/5 text-uet-navy shadow-sm scale-105" 
                     : "border-slate-100 text-slate-400 hover:border-slate-200"
                   }`}
                 >
                   <Truck size={24} className="mb-2" />
                   <span className="text-xs font-bold uppercase">Delivery</span>
                 </button>
                 <button 
                   type="button"
                   onClick={() => setOrderType("takeaway")}
                   className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                     orderType === 'takeaway' 
                     ? "border-uet-gold bg-uet-gold/5 text-uet-navy shadow-sm scale-105" 
                     : "border-slate-100 text-slate-400 hover:border-slate-200"
                   }`}
                 >
                   <ShoppingBag size={24} className="mb-2" />
                   <span className="text-xs font-bold uppercase">Pre Order</span>
                 </button>
               </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
               <h3 className="text-lg font-bold text-uet-navy mb-6 flex items-center space-x-2">
                 <CreditCard size={20} className="text-uet-gold" />
                 <span>Payment Method</span>
               </h3>

               <div className="grid grid-cols-2 gap-4">
                 <button 
                   type="button"
                   onClick={() => setPaymentMethod("cod")}
                   className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                     paymentMethod === 'cod' 
                     ? "border-uet-gold bg-uet-gold/5 text-uet-navy shadow-sm scale-105" 
                     : "border-slate-100 text-slate-400 hover:border-slate-200"
                   }`}
                 >
                   <Banknote size={24} className="mb-2" />
                   <span className="text-xs font-bold uppercase">Cash on Delivery</span>
                 </button>
                 <button 
                   type="button"
                   onClick={() => setPaymentMethod("stripe")}
                   className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                     paymentMethod === 'stripe' 
                     ? "border-uet-gold bg-uet-gold/5 text-uet-navy shadow-sm scale-105" 
                     : "border-slate-100 text-slate-400 hover:border-slate-200"
                   }`}
                 >
                   <CreditCard size={24} className="mb-2" />
                   <span className="text-xs font-bold uppercase">Online Payment</span>
                 </button>
               </div>
            </div>
          </div>

          {/* Final Summary Card */}
          <div className="lg:col-span-1">
             <div className="bg-uet-navy text-white rounded-[2.5rem] p-8 shadow-navy shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-uet-gold/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                
                <h3 className="text-xl font-poppins font-bold mb-8 flex items-center space-x-2">
                  <CheckCircle2 size={24} className="text-uet-gold" />
                  <span>Final Total</span>
                </h3>

                <div className="space-y-4 mb-10">
                  <div className="flex justify-between text-blue-100/60 font-medium font-poppins">
                    <span>Order Subtotal</span>
                    <span>Rs. {cartTotal}</span>
                  </div>
                  <div className="flex justify-between items-center text-blue-100/60 font-medium">
                    <span className="flex items-center gap-2">
                      {orderType === 'delivery' ? <Truck size={14} /> : <ShoppingBag size={14} />}
                      {orderType === 'delivery' ? 'Delivery Fee' : 'Pre Order'}
                    </span>
                    <span className="text-uet-gold font-bold">FREE</span>
                  </div>
                  <div className="h-px bg-white/10 my-6"></div>
                  <div className="flex justify-between text-2xl font-bold text-white">
                    <span>Grand Total</span>
                    <span className="text-uet-gold">Rs. {cartTotal}</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading || cart.length === 0}
                  className="w-full bg-uet-gold text-uet-navy py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-white transition-all shadow-gold active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><span>Place Multi-Order</span> <ArrowRight size={20} /></>}
                </button>

                 <p className="text-center mt-6 text-[10px] text-blue-100/30 uppercase tracking-[0.2em] font-medium leading-relaxed">
                  Encryption active. Secure checkout via UET Panda Gate.
                </p>
             </div>
          </div>
        </form>
        )}
      </div>
    </main>
  );
};

export default function ProtectedCheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutPage />
    </ProtectedRoute>
  );
}
