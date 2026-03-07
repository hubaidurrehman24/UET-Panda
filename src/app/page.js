"use client";
import React, { useRef, useState, useEffect } from "react";
import Navbar from "@/components/common/Navbar";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  Utensils,
  Flame,
  Star,
  ShoppingCart,
  Clock,
  Store,
} from "lucide-react";
import Link from "next/link";
import { ref, query, orderByChild, limitToFirst, onValue, equalTo } from "firebase/database";
import { db } from "@/firebase/config";
import { useCartContext } from "@/context/CartContext";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

/* ─── Cafe Card Data ───────────────────────────────────── */
const cafes = [
  { id: "cafe1", name: "Cafe 1", tagline: "Classic desi meals & famous biryani",     specialty: "Biryani & Karahi",    image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=600&auto=format&fit=crop&q=80", rating: "4.8", color: "from-orange-600 to-red-700",    badge: "🔥 Most Popular" },
  { id: "cafe2", name: "Cafe 2", tagline: "Fresh burgers, sandwiches & crispy fries", specialty: "Fast Food",            image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80", rating: "4.6", color: "from-yellow-500 to-orange-600", badge: "⚡ Quick Bites" },
  { id: "cafe3", name: "Cafe 3", tagline: "Hot tea, cold drinks & light snacks",      specialty: "Beverages",            image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&auto=format&fit=crop&q=80", rating: "4.5", color: "from-emerald-600 to-teal-700",  badge: "☕ Best Chai" },
  { id: "cafe4", name: "Cafe 4", tagline: "Shawarmas, rolls & street style eats",     specialty: "Street Food",          image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop&q=80", rating: "4.7", color: "from-purple-600 to-indigo-700", badge: "🌯 Street Eats" },

];

/* ─── Component ────────────────────────────────────────── */
export default function Home() {
  const cafeSectionRef = useRef(null);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [addedId, setAddedId] = useState(null);
  const { addToCart } = useCartContext();
  const { user } = useAuthContext();
  const router = useRouter();

  // Fetch 10 items from Realtime Database (all cafes)
  useEffect(() => {
    const productsRef = ref(db, "products");
    const q = query(productsRef, orderByChild("isHidden"), equalTo(false), limitToFirst(10));
    
    const unsub = onValue(q, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setFeaturedItems(Object.entries(data).map(([id, val]) => ({ id, ...val })));
      } else {
        setFeaturedItems([]);
      }
    });
    return () => unsub();
  }, []);

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

      {/* ══════════════════════════════════════════════════
          HERO — always fits the viewport, no overflow
      ══════════════════════════════════════════════════ */}
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
              5 Cafes · One Unified Cart
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
            <span className="text-uet-gold font-bold">5 UET cafes</span>{" "}
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
              { value: "5",      label: "Cafes" },
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

      {/* ══════════════════════════════════════════════════
          CAFE CARDS
      ══════════════════════════════════════════════════ */}
      <section ref={cafeSectionRef} className="py-20 px-4">
        <div className="container mx-auto max-w-[1400px]">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl xl:text-5xl font-poppins font-bold text-uet-navy">
              Choose Your <span className="text-uet-gold">Cafe</span>
            </h2>
            <p className="text-slate-500 font-medium mt-3 max-w-xl mx-auto text-sm md:text-base">
              Each cafe has its own unique menu. Pick one to explore and order.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-6 xl:gap-8">
            {cafes.map((cafe, i) => (
              <motion.div
                key={cafe.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img src={cafe.image} alt={cafe.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${cafe.color} opacity-60`} />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-bold text-uet-navy shadow-sm">{cafe.badge}</div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Star size={11} className="text-uet-gold fill-uet-gold" />
                    <span className="text-[11px] font-bold text-uet-navy">{cafe.rating}</span>
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

      {/* ══════════════════════════════════════════════════
          FEATURED ITEMS (10 items across all cafes)
      ══════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-[1400px]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-uet-gold mb-2">From All Cafes</p>
              <h2 className="text-3xl md:text-4xl font-poppins font-bold text-uet-navy">
                Popular <span className="text-uet-gold">Items</span>
              </h2>
            </div>
            <Link
              href="/menu"
              className="self-start sm:self-auto flex items-center gap-2 bg-uet-navy text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-uet-gold hover:text-uet-navy transition-all active:scale-95 shadow-md"
            >
              <span>Explore More</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {featuredItems.length === 0 ? (
            <div className="text-center py-24 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
              <Utensils size={44} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">Add food items via the Admin Panel to see them here.</p>
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
                  className="group bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div className="h-40 bg-slate-200 relative overflow-hidden">
                    <img
                      src={item.image || `https://via.placeholder.com/400x300?text=${item.name}`}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-uet-navy/90 text-uet-gold text-[11px] font-bold px-2.5 py-1 rounded-full">
                      Rs. {item.price}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex items-center gap-1 mb-1">
                      <Store size={11} className="text-uet-gold" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.cafeName || item.cafeId}</span>
                    </div>
                    <h3 className="font-bold text-uet-navy text-sm leading-tight line-clamp-1 flex-grow">{item.name}</h3>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center text-slate-400 text-[11px] font-medium">
                        <Clock size={11} className="mr-1" />
                        <span>15–20 min</span>
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
              href="/menu"
              className="inline-flex items-center gap-3 bg-uet-navy text-white px-10 py-4 rounded-2xl font-bold text-base hover:bg-uet-gold hover:text-uet-navy transition-all active:scale-95 shadow-navy shadow-lg"
            >
              <Utensils size={20} />
              <span>Explore All Menu Items</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════ */}
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
    </main>
  );
}
