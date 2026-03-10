"use client";
import React, { useState, useEffect } from "react";
import { Navbar } from "@uet-panda/shared-ui";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ref, query, orderByChild, equalTo, onValue } from "firebase/database";
import { db, useCartContext, useAuthContext } from "@uet-panda/shared-config";
import {
  Search,
  ShoppingCart,
  Star,
  Clock,
  Utensils,
  ChevronDown,
  X,
  ArrowLeft,
  ArrowRight,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { useAuthContext } from "@uet-panda/shared-config";
import { useRouter } from "next/navigation";

const cafeInfo = {
  cafe1: { name: "Cafe 1", specialty: "Biryani & Karahi", image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=1200&auto=format&fit=crop&q=80", color: "from-orange-700 to-red-800" },
  cafe2: { name: "Cafe 2", specialty: "Fast Food",          image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop&q=80", color: "from-yellow-600 to-orange-700" },
  cafe3: { name: "Cafe 3", specialty: "Beverages",          image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=1200&auto=format&fit=crop&q=80", color: "from-emerald-700 to-teal-800" },
  cafe4: { name: "Cafe 4", specialty: "Street Food",        image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=1200&auto=format&fit=crop&q=80", color: "from-purple-700 to-indigo-800" },

};

const SORT_OPTIONS = ["Default", "Price: Low to High", "Price: High to Low", "A-Z"];

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "fast-food", label: "Fast Food" },
  { id: "desi", label: "Desi Food" },
  { id: "chinese", label: "Chinese" },
  { id: "deals", label: "Deals" },
  { id: "snacks", label: "Snacks" },
  { id: "drinks", label: "Drinks" },
  { id: "breakfast", label: "Breakfast" }
];

export default function CafeMenuPage() {
  const { cafeId } = useParams();
  const cafe = cafeInfo[cafeId] || { name: cafeId, specialty: "Menu", image: "", color: "from-uet-navy to-blue-900" };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("Default");
  const [addedId, setAddedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const { addToCart } = useCartContext();
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, selectedCategory, itemsPerPage]);

  useEffect(() => {
    const productsRef = ref(db, "products");
    const q = query(productsRef, orderByChild("cafeId"), equalTo(cafeId));
    
    const unsub = onValue(q, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Firebase queries support one OrderByChild filter, so we filter out isHidden in JS
        const activeItems = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .filter(item => item.isHidden === false);
        setItems(activeItems);
      } else {
        setItems([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [cafeId]);

  const handleAddToCart = (item) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    addToCart(item);
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  // Filter + Sort pipeline
  let displayed = items
    .filter((i) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q);
      const itemCat = i.category || "desi";
      const matchCategory = selectedCategory === "all" || itemCat === selectedCategory;
      return matchSearch && matchCategory;
    });

  if (sortBy === "Price: Low to High") displayed.sort((a, b) => a.price - b.price);
  else if (sortBy === "Price: High to Low") displayed.sort((a, b) => b.price - a.price);
  else if (sortBy === "A-Z") displayed.sort((a, b) => a.name.localeCompare(b.name));

  // Pagination Support
  const totalPages = Math.ceil(displayed.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = displayed.slice(indexOfFirstItem, indexOfLastItem);

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
              <span className="text-white font-bold text-sm">{items.length} Items Available</span>
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

          {/* Items Per Page */}
          <div className="relative flex-shrink-0">
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); }}
              className="appearance-none bg-slate-100 text-slate-600 pl-4 pr-10 py-3 rounded-2xl font-bold text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-uet-gold"
            >
              <option value={12}>12 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>
        </div>
      </div>

      {/* ── Menu Grid ── */}
      <section className="container mx-auto px-4 py-12 max-w-7xl">
        
        {/* Category Filters row */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all ${
                selectedCategory === cat.id
                  ? "bg-uet-navy text-white shadow-md transform scale-105"
                  : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
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
              {currentItems.map((item, i) => (
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
        
        {/* Pagination Controls */}
        {!loading && displayed.length > 0 && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              onClick={() => {
                setCurrentPage(p => Math.max(1, p - 1));
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ArrowLeft size={16} />
            </button>
            
            <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[60vw] sm:max-w-none">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentPage(i + 1);
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className={`flex-shrink-0 w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                    currentPage === i + 1 ? "bg-uet-navy text-white shadow-md transform scale-105" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                setCurrentPage(p => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
