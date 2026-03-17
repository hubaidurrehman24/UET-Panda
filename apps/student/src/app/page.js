"use client";
import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Navbar } from "@uet-panda/shared-ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  Utensils,
  Flame,
  Star,
  ShoppingCart,
  Clock,
  Store,
  X,
} from "lucide-react";
import Link from "next/link";
import { ref, query, orderByChild, limitToFirst, onValue, equalTo } from "firebase/database";
import { db, useCartContext, useAuthContext } from "@uet-panda/shared-config";
import { useRouter } from "next/navigation";

/* ─── Cafe Card Data ───────────────────────────────────── */
const cafes = [
  { id: "cafe1", name: "Bhola", tagline: "Classic desi meals & famous biryani",     specialty: "Biryani & Karahi",    image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=600&auto=format&fit=crop&q=80", rating: "Loading...", color: "from-orange-600 to-red-700",    badge: "🔥 Most Popular" },
  { id: "cafe2", name: "GSSC", tagline: "Fresh burgers, sandwiches & crispy fries", specialty: "Fast Food",            image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80", rating: "Loading...", color: "from-yellow-500 to-orange-600", badge: "⚡ Quick Bites" },
  { id: "cafe3", name: "BSSC", tagline: "Hot tea, cold drinks & light snacks",      specialty: "Beverages",            image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&auto=format&fit=crop&q=80", rating: "Loading...", color: "from-emerald-600 to-teal-700",  badge: "☕ Best Chai" },
  { id: "cafe4", name: "Aneexe", tagline: "Shawarmas, rolls & street style eats",     specialty: "Street Food",          image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop&q=80", rating: "Loading...", color: "from-purple-600 to-indigo-700", badge: "🌯 Street Eats" },
];

/* ─── Component ────────────────────────────────────────── */
export default function Home() {
  const cafeSectionRef = useRef(null);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [addedId, setAddedId] = useState(null);
  const [reviews, setReviews] = useState({});
  const [cafeRatings, setCafeRatings] = useState({});
  const [viewingFeedback, setViewingFeedback] = useState(null);
  const { addToCart } = useCartContext();
  const { user } = useAuthContext();
  const router = useRouter();

  // Fetch deals from Firebase and interleave them evenly across all cafes
  useEffect(() => {
    const cafesList = ["cafe1", "cafe2", "cafe3", "cafe4"];
    const allFetchedDeals = {};
    const unsubs = [];

    cafesList.forEach(cafeId => {
      const menuRef = ref(db, `menu/${cafeId}`);
      const q = query(menuRef, orderByChild("category"), equalTo("deals"));
      
      const unsub = onValue(q, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          allFetchedDeals[cafeId] = Object.entries(data)
            .map(([id, val]) => ({ id, ...val, cafeId }))
            .filter(item => !item.isHidden);
        } else {
          allFetchedDeals[cafeId] = [];
        }

        // Interleave deals from all cafes evenly, up to 10
        const mixed = [];
        let index = 0;
        let itemsAdded = true;
        
        while (mixed.length < 10 && itemsAdded) {
          itemsAdded = false;
          for (const cid of cafesList) {
            if (allFetchedDeals[cid] && allFetchedDeals[cid][index]) {
              mixed.push(allFetchedDeals[cid][index]);
              itemsAdded = true;
              if (mixed.length === 10) break;
            }
          }
          index++;
        }
        setFeaturedItems(mixed);
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach(fn => fn());
  }, []);

  // Fetch reviews for dynamic ratings
  useEffect(() => {
    const reviewsRef = ref(db, "reviews");
    const unsub = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const itemGroups = {};
        const cafeGroups = {};
        
        Object.values(data).forEach(review => {
          if (review.isHidden) return;
          
          // Item Level
          const itemId = review.itemId;
          if (!itemGroups[itemId]) itemGroups[itemId] = [];
          itemGroups[itemId].push(review);

          // Cafe Level
          const cafeId = review.cafeId;
          if (!cafeGroups[cafeId]) cafeGroups[cafeId] = [];
          cafeGroups[cafeId].push(review.rating);
        });

        setReviews(itemGroups);
        
        // Calculate cafe averages
        const cRatings = {};
        Object.entries(cafeGroups).forEach(([cid, rs]) => {
          const avg = rs.reduce((a, b) => a + b, 0) / rs.length;
          cRatings[cid] = avg.toFixed(1);
        });
        setCafeRatings(cRatings);
      }
    });
    return () => unsub();
  }, []);

  const getRatingSummary = (itemId) => {
    const itemReviews = reviews[itemId];
    if (!itemReviews || itemReviews.length === 0) return null;
    const avg = itemReviews.reduce((a, b) => a + b.rating, 0) / itemReviews.length;
    return { avg: avg.toFixed(1), count: itemReviews.length };
  };

  const handleAddToCart = (item) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    addToCart(item);
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      {/* Hero Section */}
      <section
        className="
          bg-uet-navy text-white relative overflow-hidden
          flex flex-col items-center justify-center
          /* Fill the remaining viewport height after the 64-px navbar */
          min-h-[calc(100dvh-64px)]
          py-8 px-4
        "
      >
        {/* Blobs */}
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-uet-gold/10 rounded-full -mr-[20vw] -mt-[20vw] blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-blue-500/10 rounded-full -ml-[20vw] -mb-[20vw] blur-[80px] pointer-events-none" />

        <div className="container mx-auto max-w-4xl text-center relative z-10 flex flex-col items-center gap-6">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full backdrop-blur-sm"
          >
            <Flame size={13} className="text-uet-gold" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100/80">
              All Campus Cafes · One Unified Cart
            </span>
          </motion.div>

          {/* Heading — fluid font-size so it never clips */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-poppins font-bold leading-tight
              text-[clamp(2.5rem,8vw,5rem)]"
          >
            UET{" "}
            <span className="text-uet-gold">PANDA</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-blue-100/70 max-w-xl mx-auto font-medium leading-relaxed
              text-[clamp(0.9rem,2.5vw,1.25rem)]"
          >
            Your campus hunger solved. Order from any of the{" "}
            <span className="text-uet-gold font-bold">UET cafes</span>{" "}
            — all in one seamless experience.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={() => cafeSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="group bg-uet-gold text-uet-navy px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-gold hover:bg-white transition-all active:scale-95 text-sm md:text-base"
            >
              <Utensils size={18} />
              <span>Browse Cafes</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              href="/menu"
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-white/20 transition-all active:scale-95 text-sm md:text-base"
            >
              View All Menus
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-8 md:gap-14 pt-6 border-t border-white/10 w-full"
          >
            {[
              { value: cafes.length > 0 ? Object.keys(cafes).length : "All", label: "Cafes" },
              { value: "50+",    label: "Menu Items" },
              { value: "15 min", label: "Avg. Delivery" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-bold font-poppins text-uet-gold text-[clamp(1.4rem,4vw,2rem)]">{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100/40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={() => cafeSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="absolute bottom-6 animate-bounce text-white/30 hover:text-uet-gold transition-colors"
          aria-label="Scroll down"
        >
          <ChevronDown size={28} />
        </button>
      </section>

      {/* Cafe Cards Section */}
      <section id="cafes" ref={cafeSectionRef} className="py-20 px-4">
        <div className="container mx-auto max-w-[1400px]">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl xl:text-5xl font-poppins font-bold text-uet-navy">
              Choose Your <span className="text-uet-gold">Cafe</span>
            </h2>
            <p className="text-slate-500 font-medium mt-3 max-w-xl mx-auto text-sm md:text-base">
              Each cafe has its own unique menu. Pick one to explore and order.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 xl:gap-8">
            {cafes.map((cafe, i) => (
              <motion.div
                key={cafe.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.33%-2rem)] 2xl:w-[calc(20%-2.5rem)] max-w-[320px]"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={cafe.image}
                    alt={cafe.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${cafe.color} opacity-60`} />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-bold text-uet-navy shadow-sm">{cafe.badge}</div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Star size={11} className="text-uet-gold fill-uet-gold" />
                    <span className="text-[11px] font-bold text-uet-navy">
                      {cafeRatings[cafe.id] || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col flex-grow">
                  <span className="text-[10px] font-bold text-uet-gold uppercase tracking-[0.22em]">{cafe.specialty}</span>
                  <h3 className="text-xl font-poppins font-bold text-uet-navy mt-1 mb-2">{cafe.name}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed flex-grow">{cafe.tagline}</p>
                  <Link
                    href={`/cafe/${cafe.id}`}
                    className="group/btn mt-5 flex items-center justify-between bg-uet-navy text-white px-5 py-3.5 rounded-2xl font-bold text-sm hover:bg-uet-gold hover:text-uet-navy transition-all active:scale-95 shadow-md"
                  >
                    <span>Order from {cafe.name}</span>
                    <div className="bg-white/10 p-1.5 rounded-xl">
                      <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Deals Section */}
      <section id="deals" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-[1400px]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-uet-gold mb-2">Exclusive Offers</p>
              <h2 className="text-3xl md:text-4xl font-poppins font-bold text-uet-navy">
                Handpicked <span className="text-uet-gold">Deals</span>
              </h2>
            </div>
            <Link
              href="/menu?category=deals"
              className="self-start sm:self-auto flex items-center gap-2 bg-uet-navy text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-uet-gold hover:text-uet-navy transition-all active:scale-95 shadow-md"
            >
              <span>Explore More</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {featuredItems.length === 0 ? (
            <div className="text-center py-24 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
              <Utensils size={44} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">New deals are added frequently. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {featuredItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="group bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-row sm:flex-col"
                >
                  <div className="w-[110px] sm:w-full h-[130px] sm:h-40 bg-slate-200 relative overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image || `https://via.placeholder.com/400x300?text=${encodeURIComponent(item.name)}`}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 110px, 320px"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-uet-navy/90 text-uet-gold text-[11px] font-bold px-2.5 py-1 rounded-full">
                      Rs. {item.price}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 flex flex-col flex-grow min-w-0 justify-between">
                    <div className="flex items-center gap-1 mb-1">
                      <Store size={11} className="text-uet-gold" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {cafes.find(c => c.id === item.cafeId)?.name || item.cafeName || item.cafeId}
                      </span>
                    </div>
                    <h3 className="font-bold text-uet-navy text-sm leading-tight line-clamp-2 flex-grow">{item.name}</h3>
                    <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100">
                      <div className="flex items-center text-slate-400 text-[11px] font-medium">
                        <Clock size={11} className="mr-1" />
                        <span>15–20 min</span>
                        {getRatingSummary(item.id || item.name) && (
                          <button 
                            onClick={() => setViewingFeedback(item)}
                            className="flex items-center gap-0.5 ml-3 bg-uet-gold/10 px-1.5 py-0.5 rounded-lg text-uet-navy hover:bg-uet-gold/20 transition-all group/rating"
                          >
                            <Star size={9} className="text-uet-gold fill-uet-gold group-hover/rating:scale-110 transition-transform" />
                            <span className="text-[9px] font-bold">
                              {getRatingSummary(item.id || item.name).avg}
                            </span>
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddToCart(item)}
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
            </div>
          )}

          {/* Bottom Explore More */}
          <div className="text-center mt-12">
            <Link
              href="/menu?category=deals"
              className="inline-flex items-center gap-3 bg-uet-navy text-white px-10 py-4 rounded-2xl font-bold text-base hover:bg-uet-gold hover:text-uet-navy transition-all active:scale-95 shadow-navy shadow-lg"
            >
              <Utensils size={20} />
              <span>Explore All Deals</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-uet-navy text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-uet-gold/5 rounded-full -mr-60 -mt-60 blur-[100px] pointer-events-none" />
        <div className="container mx-auto max-w-[1400px] px-4 pt-16 pb-8 relative z-10">

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pb-12 border-b border-white/10">

            {/* Brand + Social */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-uet-gold p-2.5 rounded-xl shadow-gold">
                  <span className="text-uet-navy font-bold text-2xl leading-none font-poppins">P</span>
                </div>
                <span className="font-poppins font-bold text-2xl tracking-tight">
                  UET <span className="text-uet-gold">PANDA</span>
                </span>
              </div>
              <p className="text-blue-100/50 text-sm leading-relaxed mb-6">
                The unified food ordering platform for UET Lahore. Order from 5 cafes in one seamless cart.
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-uet-gold/70 mb-3">Follow Us</p>
              <div className="flex items-center gap-2">
                {[
                  { label: "Facebook", href: "#", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
                  { label: "Instagram", href: "#", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
                  { label: "X", href: "#", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                  { label: "WhatsApp", href: "#", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> },
                ].map((s) => (
                  <a key={s.label} href={s.href} aria-label={s.label}
                    className="w-9 h-9 bg-white/8 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:bg-uet-gold hover:text-uet-navy hover:border-uet-gold hover:scale-110 transition-all duration-200 active:scale-95"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>



            {/* Contact */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-uet-gold mb-5">Contact Us</p>
              <div className="space-y-4">
                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 bg-white/8 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-uet-gold/10 group-hover:border-uet-gold/30 transition-all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-uet-gold/60 group-hover:text-uet-gold transition-colors"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/60">Address</p>
                    <p className="text-sm text-blue-100/40 leading-relaxed">UET Lahore, Grand Trunk Road, Lahore</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 bg-white/8 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-uet-gold/10 group-hover:border-uet-gold/30 transition-all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-uet-gold/60 group-hover:text-uet-gold transition-colors"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/60">Email</p>
                    <a href="mailto:support@uetpanda.pk" className="text-sm text-blue-100/40 hover:text-uet-gold transition-colors">support@uetpanda.pk</a>
                  </div>
                </div>
                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 bg-white/8 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-uet-gold/10 group-hover:border-uet-gold/30 transition-all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-uet-gold/60 group-hover:text-uet-gold transition-colors"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/60">Cafe Hours</p>
                    <p className="text-sm text-blue-100/40">Mon–Sat &nbsp;8:00 AM – 6:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Bar ── */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-blue-100/25 font-medium">
              © {new Date().getFullYear()} UET Panda. All rights reserved.
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-uet-gold/40 rounded-full" />
              <span className="text-[11px] text-blue-100/25 font-medium">Built for UET Lahore · Multi-Vendor Food System</span>
              <span className="w-1.5 h-1.5 bg-uet-gold/40 rounded-full" />
            </div>
          </div>
        </div>
      </footer>

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
