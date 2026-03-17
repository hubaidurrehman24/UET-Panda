"use client";
import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { Navbar } from "@uet-panda/shared-ui";
import { db, useCartContext, useAuthContext } from "@uet-panda/shared-config";
import { ref, query, orderByChild, equalTo, onValue } from "firebase/database";
import {
  Search,
  SlidersHorizontal,
  ShoppingCart,
  Star,
  Clock,
  Utensils,
  Store,
  X,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

const CAFES = [
  { id: "all",   label: "All Cafes" },
  { id: "cafe1", label: "Bhola" },
  { id: "cafe2", label: "GSSC" },
  { id: "cafe3", label: "BSSC" },
  { id: "cafe4", label: "Aneexe" },
];

const SORT_OPTIONS = [
  "Default",
  "Price: Low to High",
  "Price: High to Low",
  "Name: A–Z",
];

const CAFE_NAMES = {
  cafe1: "Bhola",
  cafe2: "GSSC",
  cafe3: "BSSC",
  cafe4: "Aneexe",
};

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

function MenuContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCafe, setSelectedCafe] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("Default");
  const [addedId, setAddedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [reviews, setReviews] = useState({});
  const [viewingFeedback, setViewingFeedback] = useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const { addToCart } = useCartContext();
  const { user } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Detect category from URL
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCafe, sortBy, selectedCategory, itemsPerPage]);

  useEffect(() => {
    const menuRef = ref(db, "menu");
    const unsub = onValue(menuRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Data is { cafe1: { id1: {...}, id2: {...} }, cafe2: {...} }
        const allItems = [];
        Object.keys(data).forEach(cafeId => {
          Object.entries(data[cafeId]).forEach(([id, val]) => {
            if (!val.isHidden) {
              allItems.push({ id, ...val, cafeId });
            }
          });
        });
        setItems(allItems);
      } else {
        setItems([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const reviewsRef = ref(db, "reviews");
    const unsub = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const grouped = {};
        Object.values(data).forEach(review => {
          if (review.isHidden) return;
          const id = review.itemId;
          if (!grouped[id]) grouped[id] = [];
          grouped[id].push(review);
        });
        setReviews(grouped);
      }
    });
    return () => unsub();
  }, []);

  const getRatingSummary = (itemId) => {
    const itemReviews = reviews[itemId];
    if (!itemReviews || itemReviews.length === 0) return null;
    const avg = itemReviews.reduce((a, b) => a + b.rating, 0) / itemReviews.length;
    return { avg: avg.toFixed(1), count: itemReviews.length, items: itemReviews };
  };

  const handleAdd = (item) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    addToCart(item);
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  // Filter + Sort pipeline
  const totalItemsCount = selectedCafe === "all" ? items.length : items.filter(i => i.cafeId === selectedCafe).length;

  let displayed = items.filter((i) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      i.name.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q);
    const matchCafe = selectedCafe === "all" || i.cafeId === selectedCafe;
    
    // Check category: if product has no category, treat it as desi
    const itemCat = i.category || "desi";
    const matchCategory = selectedCategory === "all" || itemCat === selectedCategory;
    
    return matchSearch && matchCafe && matchCategory;
  });

  if (sortBy === "Price: Low to High")  displayed = displayed.sort((a, b) => a.price - b.price);
  else if (sortBy === "Price: High to Low")  displayed = displayed.sort((a, b) => b.price - a.price);
  else if (sortBy === "Name: A–Z")           displayed = displayed.sort((a, b) => a.name.localeCompare(b.name));
  else {
    // INTERLEAVED APPROACH: Mix cafes evenly for 'Default' sort
    const cafeGroups = {};
    displayed.forEach(item => {
      const cid = item.cafeId || 'unknown';
      if (!cafeGroups[cid]) cafeGroups[cid] = [];
      cafeGroups[cid].push(item);
    });

    const interleaved = [];
    let hasMore = true;
    let idx = 0;
    const cafeKeys = Object.keys(cafeGroups);
    
    while (hasMore) {
      hasMore = false;
      for (const cid of cafeKeys) {
        if (idx < cafeGroups[cid].length) {
          interleaved.push(cafeGroups[cid][idx]);
          hasMore = true;
        }
      }
      idx++;
    }
    displayed = interleaved;
  }

  // Pagination Support
  const totalPages = Math.ceil(displayed.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = displayed.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-20">
      <Navbar />

      {/* ── Page Header ── */}
      <div className="bg-uet-navy text-white py-10 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,215,0,0.08)_0%,transparent_60%)] pointer-events-none" />
        <div className="container mx-auto max-w-[1400px] relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-bold mb-4"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-uet-gold mb-1">
                Full Catalogue
              </p>
              <h1 className="text-3xl md:text-4xl xl:text-5xl font-poppins font-bold">
                All Menus
              </h1>
            </div>
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full backdrop-blur-sm text-sm font-bold text-white/70">
              <Utensils size={14} className="text-uet-gold" />
              <span>{totalItemsCount} items</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Search / Filter Bar ── */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 py-4 max-w-[1400px]">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Base */}
            <div className="flex gap-2 w-full md:w-auto flex-grow">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type="text"
                  placeholder="Search any food item..."
                  className="w-full bg-slate-50 border border-slate-200 py-3 pl-11 pr-4 rounded-2xl text-uet-navy font-medium focus:outline-none focus:ring-2 focus:ring-uet-gold transition-all text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-uet-navy mt-0.5">
                    <X size={15} />
                  </button>
                )}
              </div>
              {/* Mobile Filter Button */}
              <button 
                onClick={() => setIsMobileFilterOpen(true)}
                className="md:hidden flex-shrink-0 bg-uet-navy text-white px-4 py-3 rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-all"
              >
                <SlidersHorizontal size={20} />
              </button>
            </div>

            {/* Desktop Cafe Filter Chips */}
            <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap pb-1">
              {CAFES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCafe(c.id)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    selectedCafe === c.id
                      ? "bg-uet-navy text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Desktop Sort */}
            <div className="hidden md:block relative flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-uet-navy text-white pl-4 pr-9 py-3 rounded-2xl font-bold text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-uet-gold"
              >
                {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={13} />
            </div>

            {/* Desktop Items Per Page */}
            <div className="hidden md:block relative flex-shrink-0">
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); }}
                className="appearance-none bg-slate-100 text-slate-600 pl-4 pr-9 py-3 rounded-2xl font-bold text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-uet-gold"
              >
                <option value={12}>12 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Items Grid ── */}
      <section className="container mx-auto px-4 py-12 max-w-[1400px]">
        
        {/* Category Filters row (Desktop Only) */}
        <div className="hidden md:flex flex-wrap gap-2 mb-8">
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
        <div className="mb-6">
          <p className="text-slate-500 text-sm font-medium">
            Showing <span className="font-bold text-uet-navy">{displayed.length}</span> items
            {searchTerm && <> for "<span className="text-uet-gold font-bold">{searchTerm}</span>"</>}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-uet-gold" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-28 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <Utensils size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-400">No items found</h3>
            <p className="text-slate-300 mt-2 text-sm">Try adjusting your search, cafe filter, or price range.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            <AnimatePresence mode="popLayout">
              {currentItems.map((item, i) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i < 12 ? i * 0.04 : 0 }}
                  className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-row sm:flex-col"
                >
                  {/* Image */}
                  <div className="w-[110px] sm:w-full h-[130px] sm:h-44 bg-slate-100 relative overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image || `https://via.placeholder.com/400x300?text=${encodeURIComponent(item.name)}`}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 110px, 320px"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-uet-navy/90 backdrop-blur-sm text-uet-gold text-[9px] sm:text-[11px] font-bold px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-full">
                      Rs. {item.price}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-4 flex flex-col flex-grow min-w-0 justify-between">
                    {/* Cafe Label */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <Store size={11} className="text-uet-gold flex-shrink-0" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                        {CAFE_NAMES[item.cafeId] || item.cafeName || item.cafeId}
                      </span>
                    </div>

                    {/* Name + Rating */}
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h3 className="font-bold text-uet-navy text-sm leading-tight line-clamp-2 flex-grow">
                        {item.name}
                      </h3>
                      {getRatingSummary(item.id || item.name) ? (
                        <button 
                          onClick={() => setViewingFeedback(item)}
                          className="flex items-center gap-0.5 flex-shrink-0 bg-uet-gold/10 px-1.5 py-0.5 rounded-lg hover:bg-uet-gold/20 transition-all group/rating"
                        >
                          <Star size={10} className="text-uet-gold fill-uet-gold group-hover/rating:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-uet-navy">
                            {getRatingSummary(item.id || item.name).avg}
                            <span className="text-[8px] text-slate-400 ml-0.5">({getRatingSummary(item.id || item.name).count})</span>
                          </span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-20">
                          <Star size={10} className="text-slate-300" />
                          <span className="text-[10px] font-bold text-slate-300">N/A</span>
                        </div>
                      )}
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 flex-grow">
                      {item.description || "Freshly prepared from our campus kitchen."}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-2 sm:mt-4 pt-2 border-t border-slate-50">
                      <div className="flex items-center text-slate-400 text-[11px] font-medium">
                        <Clock size={11} className="mr-1" />
                        <span>15–20 min</span>
                      </div>
                      <button
                        onClick={() => handleAdd(item)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-[11px] transition-all active:scale-95 ${
                          addedId === item.id
                            ? "bg-green-500 text-white"
                            : "bg-uet-navy text-white hover:bg-uet-gold hover:text-uet-navy"
                        }`}
                      >
                        <ShoppingCart size={13} />
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
                window.scrollTo({ top: 100, behavior: 'smooth' });
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
                    window.scrollTo({ top: 100, behavior: 'smooth' });
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
                window.scrollTo({ top: 100, behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end md:hidden">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="absolute inset-0 bg-uet-navy/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="relative bg-white w-full rounded-t-[2.5rem] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                 <h3 className="text-xl font-poppins font-bold text-uet-navy">Filters & Sort</h3>
                 <button onClick={() => setIsMobileFilterOpen(false)} className="bg-slate-50 p-2 rounded-xl text-slate-400 hover:text-uet-navy transition-colors">
                   <X size={20} />
                 </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-8 pb-32">
                 {/* Cafes */}
                 <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 ml-1 flex items-center gap-1.5"><Store size={12} /> Cafes</h4>
                    <div className="flex flex-wrap gap-2">
                      {CAFES.map((c) => (
                        <button 
                          key={c.id} onClick={() => setSelectedCafe(c.id)}
                          className={`py-2 px-4 flex-grow rounded-xl text-xs font-bold transition-all border ${selectedCafe === c.id ? "bg-uet-gold text-uet-navy border-uet-gold shadow-md" : "bg-white text-slate-500 border-slate-200"}`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                 </div>
                 {/* Categories */}
                 <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 ml-1 flex items-center gap-1.5"><Utensils size={12} /> Categories</h4>
                    <div className="flex flex-wrap gap-2">
                       {CATEGORIES.map(cat => (
                         <button
                           key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                           className={`px-4 py-2 flex-grow rounded-xl font-bold text-xs transition-all border ${selectedCategory === cat.id ? "bg-uet-navy text-white border-uet-navy shadow-md" : "bg-white text-slate-500 border-slate-200"}`}
                         >
                           {cat.label}
                         </button>
                       ))}
                    </div>
                 </div>
                 {/* Sort Option */}
                 <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 ml-1">Sort By</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {SORT_OPTIONS.map((o) => (
                        <button 
                          key={o} onClick={() => setSortBy(o)}
                          className={`py-3 px-4 rounded-xl text-[10px] font-bold transition-all border ${sortBy === o ? "bg-uet-navy text-white border-uet-navy shadow-sm" : "bg-white text-slate-400 border-slate-200"}`}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-100 flex items-center justify-between gap-4">
                 <button 
                   onClick={() => { setSelectedCafe("all"); setSelectedCategory("all"); setSortBy("Default"); }}
                   className="text-xs font-bold text-slate-400 hover:text-uet-navy px-2"
                 >
                   Reset All
                 </button>
                 <button 
                   onClick={() => setIsMobileFilterOpen(false)}
                   className="flex-grow bg-uet-navy text-white font-bold py-4 rounded-2xl shadow-navy text-sm active:scale-95 transition-transform"
                 >
                   See {displayed.length} Items
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {viewingFeedback && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingFeedback(null)}
              className="absolute inset-0 bg-uet-navy/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="bg-uet-navy p-6 relative">
                 <button 
                  onClick={() => setViewingFeedback(null)}
                  className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 overflow-hidden relative">
                    <Image
                      src={viewingFeedback.image || `https://via.placeholder.com/100?text=${encodeURIComponent(viewingFeedback.name)}`}
                      alt={viewingFeedback.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{viewingFeedback.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Star size={12} className="text-uet-gold fill-uet-gold" />
                      <span className="text-uet-gold font-bold text-sm">
                        {getRatingSummary(viewingFeedback.id || viewingFeedback.name).avg}
                      </span>
                      <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest ml-1">
                        {getRatingSummary(viewingFeedback.id || viewingFeedback.name).count} Reviews
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4 no-scrollbar">
                {reviews[viewingFeedback.id || viewingFeedback.name]?.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((r, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-uet-navy text-xs">{r.userName || "Student"}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-0.5 bg-white px-2 py-0.5 rounded-lg border border-slate-100">
                        <Star size={10} className="text-uet-gold fill-uet-gold" />
                        <span className="text-[10px] font-bold text-uet-navy">{r.rating}</span>
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-slate-600 text-xs leading-relaxed italic mt-2">"{r.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                <button 
                  onClick={() => setViewingFeedback(null)}
                  className="text-uet-navy font-bold text-sm hover:text-uet-gold transition-colors"
                >
                  Close Feedback
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function AllMenuPage() {
  return (
    <Suspense fallback={<div>Loading Menu...</div>}>
      <MenuContent />
    </Suspense>
  );
}
