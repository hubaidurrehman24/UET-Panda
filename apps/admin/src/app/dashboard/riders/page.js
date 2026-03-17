"use client";
import React, { useState, useEffect } from "react";
import { ref, query, onValue, push, set, remove, update } from "firebase/database";
import { db, useAuthContext } from "@uet-panda/shared-config";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Plus, 
  Bike, 
  Trash2, 
  Edit2, 
  Search, 
  X,
  Phone,
  Package
} from "lucide-react";

export default function RidersManagement() {
  const { cafeId } = useAuthContext();
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRider, setEditingRider] = useState(null);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!cafeId) return;
    
    const ridersRef = ref(db, `riders/${cafeId}`);
    const unsubscribe = onValue(ridersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const rList = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        rList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRiders(rList);
      } else {
        setRiders([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [cafeId]);

  const handleOpenModal = (rider = null) => {
    if (rider) {
      setEditingRider(rider);
      setFormData({ name: rider.name, phone: rider.phone });
    } else {
      setEditingRider(null);
      setFormData({ name: "", phone: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRider(null);
    setFormData({ name: "", phone: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cafeId) return;
    
    setSubmitting(true);
    try {
      if (editingRider) {
        await update(ref(db, `riders/${cafeId}/${editingRider.id}`), {
          name: formData.name,
          phone: formData.phone
        });
      } else {
        const newRiderRef = push(ref(db, `riders/${cafeId}`));
        await set(newRiderRef, {
          name: formData.name,
          phone: formData.phone,
          deliveryCount: 0,
          createdAt: new Date().toISOString()
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving rider:", error);
      alert("Failed to save rider.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to remove this rider?")) {
      try {
        await remove(ref(db, `riders/${cafeId}/${id}`));
      } catch (error) {
        console.error("Error deleting rider:", error);
        alert("Failed to delete rider.");
      }
    }
  };

  const filteredRiders = riders.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.phone.includes(searchTerm)
  );

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-uet-navy tracking-tight">Riders Management</h1>
          <p className="text-slate-500 font-medium">Manage your delivery fleet and track their deliveries</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-uet-gold text-uet-navy py-3 px-6 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-gold hover:bg-white transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus size={20} />
          <span>Add New Rider</span>
        </button>
      </header>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Active Riders</p>
            <p className="text-3xl font-bold text-uet-navy">{riders.length}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-500">
            <Users size={28} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Deliveries</p>
            <p className="text-3xl font-bold text-uet-navy">{riders.reduce((sum, r) => sum + (r.deliveryCount || 0), 0)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-2xl text-green-500">
            <Package size={28} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
           <div className="relative flex-grow">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="Search riders by name..."
               className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-uet-gold outline-none"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>
      </div>

      {/* Riders Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-uet-gold"></div>
        </div>
      ) : filteredRiders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
           <Bike size={48} className="mx-auto text-slate-200 mb-4" />
           <h3 className="text-xl font-bold text-slate-400">No riders found</h3>
           <p className="text-slate-500 mt-2 text-sm italic">Add some delivery partners to your fleet above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredRiders.map((rider) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={rider.id}
                className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                     <div className="w-14 h-14 bg-uet-navy text-uet-gold rounded-2xl flex items-center justify-center font-bold text-2xl shadow-navy">
                        {rider.name.charAt(0)}
                     </div>
                     <div>
                        <h3 className="font-bold text-uet-navy text-lg leading-tight">{rider.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Partner</p>
                     </div>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(rider)} className="p-2 text-slate-400 hover:text-uet-navy hover:bg-slate-50 rounded-xl transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(rider.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                     <div className="flex items-center text-slate-500 text-sm font-medium">
                        <Phone size={16} className="mr-3 text-uet-gold" />
                        {rider.phone}
                     </div>
                  </div>
                  <div className="flex items-center justify-between p-3 flex-row border-t border-slate-100 pt-4">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lifetime Deliveries</span>
                     <div className="flex items-center space-x-1.5 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                        <Package size={12} className="text-green-600" />
                        <span className="font-bold text-green-700 text-xs">{rider.deliveryCount || 0}</span>
                     </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-uet-navy/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="bg-uet-navy p-6 pb-12 relative">
                <button onClick={handleCloseModal} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
                <div className="bg-uet-gold w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
                  <Bike size={28} className="text-uet-navy" />
                </div>
                <h2 className="text-2xl font-poppins font-bold text-white tracking-tight">
                  {editingRider ? "Edit Rider Details" : "Add New Rider"}
                </h2>
                <p className="text-blue-100/60 text-sm italic mt-1">Register a new delivery partner for your cafe</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 -mt-8 bg-white rounded-t-[2rem] space-y-5">
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                  <input 
                    type="text" required placeholder="e.g. Ahmad Ali"
                    className="w-full bg-slate-50 border-none outline-none p-4 rounded-2xl text-uet-navy font-medium focus:ring-2 focus:ring-uet-gold transition-all"
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                  <input 
                    type="tel" required placeholder="e.g. 0300-1234567"
                    className="w-full bg-slate-50 border-none outline-none p-4 rounded-2xl text-uet-navy font-medium focus:ring-2 focus:ring-uet-gold transition-all"
                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <button 
                  type="submit" disabled={submitting}
                  className="w-full bg-uet-navy text-white py-4 rounded-2xl font-bold shadow-navy hover:bg-uet-gold hover:text-uet-navy transition-all active:scale-95 disabled:opacity-70 mt-4"
                >
                  {submitting ? "Saving..." : (editingRider ? "Update Information" : "Register Rider")}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
