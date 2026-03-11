"use client";
import React, { useState, useEffect, Suspense } from "react";
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
  { id: "cafe1", label: "Cafe 1" },
  { id: "cafe2", label: "Cafe 2" },
  { id: "cafe3", label: "Cafe 3" },
  { id: "cafe4", label: "Cafe 4" },

];

const SORT_OPTIONS = [
  "Default",
  "Price: Low to High",
  "Price: High to Low",
  "Name: A–Z",
];

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
    const productsRef = ref(db, "products");
    const q = query(productsRef, orderByChild("isHidden"), equalTo(false));
    
    const unsub = onValue(q, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setItems(Object.entries(data).map(([id, val]) => ({ id, ...val })));
      } else {
        setItems([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

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
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
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
                <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-uet-navy">
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Cafe Filter Chips — scrollable on mobile */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap pb-1">
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

            {/* Sort */}
            <div className="relative flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-uet-navy text-white pl-4 pr-9 py-3 rounded-2xl font-bold text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-uet-gold"
              >
                {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={13} />
            </div>

            {/* Items Per Page */}
            <div className="relative flex-shrink-0">
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
        
        {/* Category Filters row (like the one in Figma) */}
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
                  className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col"
                >
                  {/* Image */}
                  <div className="h-44 bg-slate-100 relative overflow-hidden">
                    <img
                      src={item.image || `https://via.placeholder.com/400x300?text=${item.name}`}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-uet-navy/90 backdrop-blur-sm text-uet-gold text-[11px] font-bold px-2.5 py-1.5 rounded-full">
                      Rs. {item.price}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-grow">
                    {/* Cafe Label */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <Store size={11} className="text-uet-gold flex-shrink-0" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                        {item.cafeName || item.cafeId}
                      </span>
                    </div>

                    {/* Name + Rating */}
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h3 className="font-bold text-uet-navy text-sm leading-tight line-clamp-2 flex-grow">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Star size={11} className="text-uet-gold fill-uet-gold" />
                        <span className="text-[11px] font-bold text-slate-500">4.8</span>
                      </div>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 flex-grow">
                      {item.description || "Freshly prepared from our campus kitchen."}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
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
