"use client";
import React from "react";
import Image from "next/image";
import { Navbar } from "@uet-panda/shared-ui";
import { useCartContext, useAuthContext } from "@uet-panda/shared-config";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Store, CreditCard } from "lucide-react";
import Link from "next/link";

const CAFE_NAMES = {
  cafe1: "Bhola",
  cafe2: "GSSC",
  cafe3: "BSSC",
  cafe4: "Aneexe",
};

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, cartTotal, getSplitOrders } = useCartContext();
  const splitOrders = getSplitOrders();

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-20">
      <Navbar />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <header className="mb-10 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block bg-uet-gold/10 p-3 rounded-2xl mb-4"
          >
            <ShoppingBag className="text-uet-gold" size={32} />
          </motion.div>
          <h1 className="text-3xl font-poppins font-bold text-uet-navy">Your Smart Cart</h1>
          <p className="text-slate-500 mt-2 font-medium italic">Items from different cafes will be separate orders</p>
        </header>

        {cart.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-16 text-center shadow-sm border border-slate-100 max-w-2xl mx-auto">
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
              <ShoppingBag size={48} />
            </div>
            <h2 className="text-2xl font-bold text-uet-navy mb-2">Cart is empty</h2>
            <p className="text-slate-400 mb-8 max-w-xs mx-auto">Looks like you haven't added any flavor to your cart yet.</p>
            <Link 
              href="/" 
              className="inline-flex items-center space-x-2 bg-uet-navy text-white px-8 py-4 rounded-2xl font-bold shadow-navy hover:bg-uet-gold hover:text-uet-navy transition-all active:scale-95"
            >
              <ArrowRight size={20} className="rotate-180" />
              <span>Continue Browsing</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-8">
              {Object.keys(splitOrders).map((cafeId) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={cafeId} 
                  className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100"
                >
                  <div className="bg-uet-navy/5 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="bg-uet-navy p-2 rounded-xl text-uet-gold">
                        <Store size={18} />
                      </div>
                      <h3 className="font-poppins font-bold text-uet-navy uppercase tracking-wider text-sm">
                        {CAFE_NAMES[cafeId] || splitOrders[cafeId][0].cafeName || `Cafe ${cafeId}`}
                      </h3>
                    </div>
                    <span className="bg-white px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 border border-slate-200 uppercase">
                      Sub-Order #{cafeId.slice(-4)}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-50">
                    {splitOrders[cafeId].map((item) => (
                      <div key={item.id} className="p-6 flex items-center space-x-4">
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 relative">
                          <Image 
                            src={item.image || `https://via.placeholder.com/100?text=${encodeURIComponent(item.name)}`} 
                            alt={item.name} 
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-bold text-uet-navy">{item.name}</h4>
                          <p className="text-xs font-bold text-uet-gold uppercase tracking-[0.1em] mt-0.5">Rs. {item.price}</p>
                        </div>
                        <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-white rounded-lg transition-colors text-uet-navy"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 hover:bg-white rounded-lg transition-colors text-uet-navy"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Price Summary */}
            <div className="lg:col-span-1">
              <div className="bg-uet-navy text-white rounded-[2.5rem] p-8 sticky top-24 shadow-navy shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-uet-gold/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                <div className="relative z-10">
                  <h3 className="text-xl font-poppins font-bold mb-6 flex items-center space-x-2">
                    <CreditCard className="text-uet-gold" />
                    <span>Summary</span>
                  </h3>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-blue-100/60 font-medium">
                      <span>Subtotal</span>
                      <span>Rs. {cartTotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-blue-100/60 font-medium">
                      <span className="flex items-center gap-2">
                        <ShoppingBag size={14} />
                        Service Fee
                      </span>
                      <span className="text-uet-gold font-bold">FREE</span>
                    </div>
                    <div className="flex justify-between text-blue-100/60 font-medium italic">
                      <span>Orders Count</span>
                      <span>{Object.keys(splitOrders).length} Cafes</span>
                    </div>
                    <div className="h-px bg-white/10 my-6"></div>
                    <div className="flex justify-between text-xl font-bold text-white">
                      <span>Total</span>
                      <span className="text-uet-gold">Rs. {cartTotal}</span>
                    </div>
                  </div>

                  <Link 
                    href="/checkout"
                    className="w-full bg-uet-gold text-uet-navy py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-white transition-all shadow-gold active:scale-95"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={20} />
                  </Link>

                  <p className="text-center mt-6 text-[10px] text-blue-100/40 uppercase tracking-[0.2em] font-medium italic">
                    Split billing applied automatically
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default CartPage;
