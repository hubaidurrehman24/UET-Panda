"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/common/Navbar";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useCartContext } from "@/context/CartContext";
import {
  Search,
  SlidersHorizontal,
  ShoppingCart,
  Star,
  Clock,
  Utensils,
  ChevronDown,
  X,
  ArrowLeft,
  Flame,
} from "lucide-react";
import Link from "next/link";

const cafeInfo = {
  cafe1: { name: "Cafe 1", specialty: "Biryani & Karahi", image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=1200&auto=format&fit=crop&q=80", color: "from-orange-700 to-red-800" },
  cafe2: { name: "Cafe 2", specialty: "Fast Food",          image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop&q=80", color: "from-yellow-600 to-orange-700" },
  cafe3: { name: "Cafe 3", specialty: "Beverages",          image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=1200&auto=format&fit=crop&q=80", color: "from-emerald-700 to-teal-800" },
  cafe4: { name: "Cafe 4", specialty: "Street Food",        image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=1200&auto=format&fit=crop&q=80", color: "from-purple-700 to-indigo-800" },
  cafe5: { name: "Cafe 5", specialty: "Desserts & Juices",  image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200&auto=format&fit=crop&q=80", color: "from-pink-600 to-rose-700" },
};

const SORT_OPTIONS = ["Default", "Price: Low to High", "Price: High to Low", "A-Z"];

export default function CafeMenuPage() {
  const { cafeId } = useParams();
  const cafe = cafeInfo[cafeId] || { name: cafeId, specialty: "Menu", image: "", color: "from-uet-navy to-blue-900" };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Default");
  const [maxPrice, setMaxPrice] = useState(2000);
  const [showFilters, setShowFilters] = useState(false);
  const [addedId, setAddedId] = useState(null);

  const { addToCart } = useCartContext();

  useEffect(() => {
    const q = query(
      collection(db, "products"),
      where("cafeId", "==", cafeId),
      where("isHidden", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [cafeId]);

  const handleAddToCart = (item) => {
    addToCart(item);
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  // Filter + Sort pipeline
  let displayed = items
    .filter((i) => {
      const q = searchTerm.toLowerCase();
      return (
        (i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)) &&
        i.price <= maxPrice
      );
    });

  if (sortBy === "Price: Low to High") displayed.sort((a, b) => a.price - b.price);
  else if (sortBy === "Price: High to Low") displayed.sort((a, b) => b.price - a.price);
  else if (sortBy === "A-Z") displayed.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ── Banner ── */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <img src={cafe.image} alt={cafe.name} className="w-full h-full object-cover" />
        <div className={`absolute inset-0 bg-gradient-to-r ${cafe.color} opacity-80`} />
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-white/70 hover:text-white transition-colors mb-4 text-sm font-bold"
          >
            <ArrowLeft size={16} />
            <span>Back to All Cafes</span>
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-[0.25em] mb-1">
                {cafe.specialty}
              </p>
              <h1 className="text-4xl md:text-5xl font-poppins font-bold text-white">{cafe.name}</h1>
            </div>
            <div className="hidden md:flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full">
              <Flame size={16} className="text-uet-gold" />
              <span className="text-white font-bold text-sm">{displayed.length} Items Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Search + Filter Bar ── */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 py-4 max-w-7xl flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-grow w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={`Search ${cafe.name} menu...`}
              className="w-full bg-slate-50 border border-slate-200 py-3 pl-11 pr-4 rounded-2xl text-uet-navy font-medium focus:outline-none focus:ring-2 focus:ring-uet-gold transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-uet-navy">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative flex-shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-uet-navy text-white pl-4 pr-10 py-3 rounded-2xl font-bold text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-uet-gold"
            >
              {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={14} />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-shrink-0 flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
              showFilters ? "bg-uet-gold text-uet-navy" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
          </button>
        </div>

        {/* Expandable Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100 bg-slate-50"
            >
              <div className="container mx-auto px-4 py-5 max-w-7xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-full sm:max-w-sm">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Max Price
                      </label>
                      <span className="text-uet-navy font-bold text-sm bg-white border border-slate-200 px-3 py-1 rounded-full">
                        Rs. {maxPrice}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={2000}
                      step={50}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full accent-uet-navy cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                      <span>Rs. 50</span>
                      <span>Rs. 2000</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setMaxPrice(2000); setSearchTerm(""); setSortBy("Default"); }}
                    className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors uppercase tracking-wider"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Menu Grid ── */}
      <section className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Result count */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-slate-500 font-medium text-sm">
            Showing <span className="font-bold text-uet-navy">{displayed.length}</span> items
            {searchTerm && <> for "<span className="text-uet-gold font-bold">{searchTerm}</span>"</>}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-uet-gold" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-28 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <Utensils size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-400">No items found</h3>
            <p className="text-slate-300 mt-2">Try adjusting your search or price filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {displayed.map((item, i) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i < 8 ? i * 0.05 : 0 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group border border-slate-100 flex flex-col"
                >
                  {/* Image */}
                  <div className="h-48 bg-slate-100 relative overflow-hidden">
                    <img
                      src={item.image || `https://via.placeholder.com/400x300?text=${item.name}`}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-uet-navy/90 backdrop-blur-sm text-uet-gold text-xs font-bold px-3 py-1.5 rounded-full">
                      Rs. {item.price}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-grow flex flex-col">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-uet-navy text-base leading-tight">{item.name}</h3>
                      <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                        <Star size={12} className="text-uet-gold fill-uet-gold" />
                        <span className="text-xs font-bold text-slate-500">4.8</span>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 flex-grow">
                      {item.description || "Freshly prepared from our kitchen. A campus favourite!"}
                    </p>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                      <div className="flex items-center text-slate-400 text-xs font-medium">
                        <Clock size={12} className="mr-1" />
                        <span>15–20 min</span>
                      </div>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                          addedId === item.id
                            ? "bg-green-500 text-white"
                            : "bg-uet-navy text-white hover:bg-uet-gold hover:text-uet-navy"
                        }`}
                      >
                        <ShoppingCart size={16} />
                        <span>{addedId === item.id ? "Added!" : "Add"}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </main>
  );
}
