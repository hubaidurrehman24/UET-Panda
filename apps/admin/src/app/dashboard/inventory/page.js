"use client";
import React, { useState, useEffect } from "react";
import { ref, query, orderByChild, equalTo, onValue, push, set, update, remove } from "firebase/database";
import { db, useAuthContext, storage } from "@uet-panda/shared-config";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Package, 
  X, 
  Check, 
  Loader2, 
  Star,
  Image as ImageIcon,
  UploadCloud
} from "lucide-react";

const InventoryPage = () => {
  const { cafeId } = useAuthContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [reviews, setReviews] = useState({});

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("desi");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!cafeId) return;

    const inventoryRef = ref(db, `menu/${cafeId}`);
    
    const unsubscribe = onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProducts(Object.entries(data).map(([id, val]) => ({ id, ...val })));
      } else {
        setProducts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [cafeId]);

  // Fetch reviews to calculate average ratings
  useEffect(() => {
    if (!cafeId) return;
    const reviewsRef = ref(db, "reviews");
    const q = query(reviewsRef, orderByChild("cafeId"), equalTo(cafeId));
    const unsub = onValue(q, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const grouped = {};
        Object.values(data).forEach(r => {
          if (r.isHidden) return; // Only count visible reviews
          if (!grouped[r.itemId]) grouped[r.itemId] = [];
          grouped[r.itemId].push(r.rating);
        });
        setReviews(grouped);
      } else {
        setReviews({});
      }
    });
    return () => unsub();
  }, [cafeId]);

  const getItemRating = (itemId) => {
    const rs = reviews[itemId];
    if (!rs || rs.length === 0) return null;
    return (rs.reduce((a, b) => a + b, 0) / rs.length).toFixed(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = image;
      
      if (imageFile) {
        setIsUploading(true);
        const fileRef = storageRef(storage, `food-images/${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`);
        await uploadBytes(fileRef, imageFile);
        imageUrl = await getDownloadURL(fileRef);
        setIsUploading(false);
      }

      const productData = {
        name: name || "",
        price: parseFloat(price) || 0,
        image: imageUrl || "",  // Save empty string if no image
        description: description || "",
        category: category || "desi",
        cafeId,
        isHidden: false,
        updatedAt: new Date().toISOString(),
      };

      if (editingProduct) {
        await update(ref(db, `menu/${cafeId}/${editingProduct.id}`), productData);
      } else {
        const newRef = push(ref(db, `menu/${cafeId}`));
        await set(newRef, {
          ...productData,
          id: newRef.key,
          createdAt: new Date().toISOString(),
        });
      }

      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert("Error saving product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVisibility = async (product) => {
    try {
      await update(ref(db, `menu/${cafeId}/${product.id}`), {
        isHidden: !product.isHidden
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await remove(ref(db, `menu/${cafeId}/${id}`));
      } catch (error) {
        console.error(error);
      }
    }
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price);
    setImage(product.image);
    setDescription(product.description);
    setCategory(product.category || "desi");
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName("");
    setPrice("");
    setImage("");
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDescription("");
    setCategory("desi");
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || p.category === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-uet-navy tracking-tight">Inventory Manager</h1>
          <p className="text-slate-500 font-medium">Control your menu and availability</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-uet-gold text-uet-navy px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-gold hover:bg-white transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>Add New Food</span>
        </button>
      </header>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Items</p>
          <p className="text-3xl font-bold text-uet-navy">{products.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Live Menu</p>
          <p className="text-3xl font-bold text-green-500">{products.filter(p => !p.isHidden).length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Hidden</p>
          <p className="text-3xl font-bold text-red-400">{products.filter(p => p.isHidden).length}</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col gap-5 bg-slate-50/50">
           {/* Top Row: Search and Status */}
           <div className="flex items-center justify-between gap-4">
             <div className="relative max-w-sm w-full">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Search inventory..." 
                 className="w-full bg-white border border-slate-200 py-2.5 pl-11 pr-4 rounded-xl text-sm focus:ring-2 focus:ring-uet-gold outline-none shadow-sm transition-all"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             
             <div className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm shrink-0">
               <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
               Real-time Sync Active
             </div>
           </div>

           {/* Bottom Row: Category Filters */}
           <div className="flex flex-wrap items-center gap-2.5 w-full">
             {["all", "desi", "fast-food", "chinese", "deals", "snacks", "drinks", "breakfast"].map((tab) => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                   activeTab === tab 
                   ? 'bg-uet-navy text-white shadow-md' 
                   : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                 }`}
               >
                 {tab.replace('-', ' ')}
               </button>
             ))}
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                <th className="px-8 py-4">Item Details</th>
                <th className="px-8 py-4">Category</th>
                <th className="px-8 py-4">Price</th>
                <th className="px-8 py-4">Rating</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {filteredProducts.map((product) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={product.id} 
                    className={`hover:bg-slate-50/50 transition-colors ${product.isHidden ? 'opacity-60 grayscale-[0.5]' : ''}`}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0">
                          <img 
                            src={product.image || `https://via.placeholder.com/100?text=${product.name}`} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div>
                          <p className="font-bold text-uet-navy">{product.name}</p>
                          <p className="text-xs text-slate-400 line-clamp-1 max-w-[200px]">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-bold text-uet-navy">Rs. {product.price}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {product.category || "desi"}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {getItemRating(product.id) ? (
                        <div className="flex items-center gap-1.5 bg-uet-gold/10 px-2.5 py-1 rounded-lg w-fit">
                          <Star size={12} className="text-uet-gold fill-uet-gold" />
                          <span className="text-xs font-bold text-uet-navy">{getItemRating(product.id)}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({reviews[product.id]?.length})</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">No Reviews</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => toggleVisibility(product)}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                          product.isHidden 
                          ? 'bg-slate-100 text-slate-400' 
                          : 'bg-green-100 text-green-600'
                        }`}
                      >
                        {product.isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                        <span>{product.isHidden ? 'Hidden' : 'Visible'}</span>
                      </button>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => openEdit(product)}
                          className="p-2 text-uet-navy hover:bg-uet-navy/5 rounded-xl transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-uet-navy/40 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="bg-uet-navy p-6 pb-12 relative">
                <button 
                  onClick={() => setShowModal(false)}
                  className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="bg-uet-gold w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
                  <Package size={28} className="text-uet-navy" />
                </div>
                <h2 className="text-2xl font-poppins font-bold text-white">
                  {editingProduct ? 'Update Product' : 'New Food Item'}
                </h2>
                <p className="text-blue-100/60 text-sm italic">Add details for your UET Panda menu</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 -mt-8 bg-white rounded-t-[2rem] space-y-6">
                 <div>
                   <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Food Name</label>
                   <input 
                     type="text" required
                     placeholder="e.g. Special Zinger Burger"
                     className="w-full bg-slate-50 border-none outline-none p-4 rounded-2xl text-uet-navy font-medium focus:ring-2 focus:ring-uet-gold transition-all"
                     value={name} onChange={(e) => setName(e.target.value)}
                   />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Price (Rs)</label>
                      <input 
                        type="number" required
                        placeholder="350"
                        className="w-full bg-slate-50 border-none outline-none p-4 rounded-2xl text-uet-navy font-medium focus:ring-2 focus:ring-uet-gold transition-all"
                        value={price} onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Category</label>
                      <select 
                        className="w-full bg-slate-50 border-none outline-none p-4 rounded-2xl text-uet-navy font-medium focus:ring-2 focus:ring-uet-gold transition-all appearance-none"
                        value={category} onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="desi">Desi Food</option>
                        <option value="fast-food">Fast Food</option>
                        <option value="chinese">Chinese</option>
                        <option value="deals">Deals</option>
                        <option value="snacks">Snacks</option>
                        <option value="drinks">Drinks</option>
                        <option value="breakfast">Breakfast</option>
                      </select>
                    </div>
                 </div>

                 <div>
                   <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Food Image</label>
                   <input 
                     type="file" 
                     accept="image/*"
                     ref={fileInputRef}
                     className="hidden"
                     onChange={(e) => {
                       if (e.target.files && e.target.files[0]) {
                         setImageFile(e.target.files[0]);
                       }
                     }}
                   />
                   <div className="flex items-center gap-4">
                     <div 
                       onClick={() => fileInputRef.current?.click()}
                       className={`flex-grow h-14 bg-slate-50 border-2 border-dashed ${imageFile || image ? 'border-green-400 bg-green-50' : 'border-slate-300'} rounded-2xl flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all font-medium text-sm text-slate-500 overflow-hidden`}
                     >
                       {imageFile ? (
                         <span className="text-green-600 truncate px-4">✓ {imageFile.name}</span>
                       ) : image ? (
                         <span className="text-uet-navy truncate px-4 font-bold">Image Uploaded (Click to change)</span>
                       ) : (
                         <span className="flex items-center gap-2"><UploadCloud size={18} /> Upload Image</span>
                       )}
                     </div>
                     {(imageFile || image) && (
                       <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative group">
                         <img 
                           src={imageFile ? URL.createObjectURL(imageFile) : image} 
                           alt="Preview" 
                           className="w-full h-full object-cover"
                         />
                         <button
                           type="button"
                           onClick={(e) => {
                             e.stopPropagation();
                             setImageFile(null);
                             setImage("");
                             if(fileInputRef.current) fileInputRef.current.value = '';
                           }}
                           className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
                         >
                           <Trash2 size={16} className="text-white" />
                         </button>
                       </div>
                     )}
                   </div>
                 </div>

                 <div>
                   <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Description</label>
                   <textarea 
                     rows="3"
                     placeholder="Short delicious description..."
                     className="w-full bg-slate-50 border-none outline-none p-4 rounded-2xl text-uet-navy font-medium focus:ring-2 focus:ring-uet-gold transition-all resize-none"
                     value={description} onChange={(e) => setDescription(e.target.value)}
                   />
                 </div>

                 <button 
                   type="submit"
                   disabled={isSubmitting || isUploading}
                   className="w-full bg-uet-navy text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-navy hover:bg-uet-gold hover:text-uet-navy transition-all active:scale-95 disabled:opacity-50"
                 >
                   {(isSubmitting || isUploading) ? <><Loader2 className="animate-spin" size={20} /> <span className="ml-2">{isUploading ? 'Uploading Image...' : 'Saving Details...'}</span></> : <><span>{editingProduct ? 'Save Changes' : 'Add to Menu'}</span> <Check size={20} /></>}
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryPage;
