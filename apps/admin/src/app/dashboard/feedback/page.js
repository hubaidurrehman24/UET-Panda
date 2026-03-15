"use client";
import React, { useState, useEffect } from "react";
import { db, useAuthContext } from "@uet-panda/shared-config";
import { ref, query, orderByChild, equalTo, onValue, update } from "firebase/database";
import { 
  Star, 
  MessageSquare, 
  Clock, 
  User, 
  Package,
  Filter,
  ArrowUpDown,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FeedbackHub() {
  const { cafeId } = useAuthContext();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState("All");

  useEffect(() => {
    if (!cafeId) return;

    const reviewsRef = ref(db, "reviews");
    const q = query(reviewsRef, orderByChild("cafeId"), equalTo(cafeId));
    
    const unsub = onValue(q, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setReviews(list);
      } else {
        setReviews([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [cafeId]);

  const toggleVisibility = async (review) => {
    try {
      await update(ref(db, `reviews/${review.id}`), {
        isHidden: !review.isHidden
      });
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  const filteredReviews = filterRating === "All" 
    ? reviews 
    : reviews.filter(r => r.rating === parseInt(filterRating));

  const stats = {
    avg: reviews.length > 0 ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : "0.0",
    total: reviews.length,
    excellent: reviews.filter(r => r.rating === 5).length
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-uet-navy tracking-tight">Feedback Hub</h1>
          <p className="text-slate-500 font-medium">Monitor your cafe's reputation and customer satisfaction</p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          {["All", "5", "4", "3", "2", "1"].map((r) => (
            <button
               key={r}
               onClick={() => setFilterRating(r)}
               className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
                 filterRating === r 
                 ? "bg-uet-gold text-uet-navy shadow-sm" 
                 : "text-slate-400 hover:text-uet-navy hover:bg-slate-50"
               }`}
            >
               {r === "All" ? "All Reviews" : `${r} Stars`}
            </button>
          ))}
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="bg-uet-gold/10 p-4 rounded-2xl text-uet-gold">
            <Star className="fill-uet-gold" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average Rating</p>
            <h3 className="text-2xl font-bold text-uet-navy">{stats.avg} / 5.0</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-500">
            <MessageSquare size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Reviews</p>
            <h3 className="text-2xl font-bold text-uet-navy">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="bg-green-50 p-4 rounded-2xl text-green-500">
            <Filter size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">5-Star Feedback</p>
            <h3 className="text-2xl font-bold text-uet-navy">{stats.excellent}</h3>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-uet-gold" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
          <MessageSquare size={48} className="mx-auto text-slate-100 mb-4" />
          <h3 className="text-xl font-bold text-slate-400">No reviews found</h3>
          <p className="text-slate-300 mt-2 text-sm">Once students rate your items, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredReviews.map((review) => (
              <motion.div
                layout
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition-all ${review.isHidden ? 'opacity-60 grayscale-[0.5]' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="bg-slate-100 p-2 rounded-xl">
                      <User size={16} className="text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-uet-navy text-sm">
                        {review.userName === "Student" && review.userEmail 
                          ? review.userEmail.split('@')[0].split(/[._]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
                          : review.userName}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Verified Buyer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleVisibility(review)}
                      className={`p-2 rounded-xl transition-all ${review.isHidden ? 'bg-slate-100 text-slate-400 hover:bg-slate-200' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      title={review.isHidden ? "Click to Show" : "Click to Hide"}
                    >
                      {review.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <div className="flex items-center bg-uet-gold/5 px-2 py-1 rounded-lg">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={10} className={`${review.rating >= s ? 'text-uet-gold fill-uet-gold' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-2xl mb-4 flex-grow">
                  <p className="text-slate-600 text-sm leading-relaxed italic">
                    {review.comment ? `"${review.comment}"` : <span className="text-slate-300 font-normal">No comment provided</span>}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                  <div className="flex items-center text-slate-400 text-[10px] font-bold lowercase tracking-widest gap-2">
                    <Package size={12} className="text-uet-gold" />
                    <span className="break-words max-w-[180px]">{review.itemName}</span>
                  </div>
                  <div className="flex items-center text-slate-300 text-[10px] font-mono">
                    <Clock size={12} className="mr-1" />
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
