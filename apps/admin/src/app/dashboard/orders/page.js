"use client";
import React, { useState, useEffect } from "react";
import { ref, query, orderByChild, equalTo, onValue, update, increment } from "firebase/database";
import { db, useAuthContext } from "@uet-panda/shared-config";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Clock, 
  Truck, 
  CheckCircle2, 
  Phone, 
  User, 
  MapPin, 
  Search, 
  ChevronDown,
  Bike,
  CreditCard,
  Banknote
} from "lucide-react";

const OrderManagement = () => {
  const { cafeId } = useAuthContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Rider assignment states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [selectedRiderId, setSelectedRiderId] = useState("");

  useEffect(() => {
    if (!cafeId) return;

    // Fetch Orders
    const ordersRef = ref(db, "orders");
    const qOrders = query(ordersRef, orderByChild("cafeId"), equalTo(cafeId));
    
    const unsubOrders = onValue(qOrders, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const o = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        o.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(o);
      } else {
        setOrders([]);
      }
      setLoading(false);
    });

    // Fetch Riders
    const ridersRef = ref(db, `riders/${cafeId}`);
    const unsubRiders = onValue(ridersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const r = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setAvailableRiders(r);
      } else {
        setAvailableRiders([]);
      }
    });

    return () => {
      unsubOrders();
      unsubRiders();
    };
  }, [cafeId]);

  const updateStatus = async (orderId, newStatus, extraData = {}) => {
    try {
      const updates = {
        [`orders/${orderId}/status`]: newStatus,
        [`orders/${orderId}/updatedAt`]: new Date().toISOString()
      };
      
      Object.entries(extraData).forEach(([k, v]) => {
        updates[`orders/${orderId}/${k}`] = v;
      });

      // Increment rider delivery count if a dispatched order is completed
      if (newStatus === "Delivered" || newStatus === "Collected") {
        const order = orders.find(o => o.id === orderId);
        if (order && order.riderId) {
          updates[`riders/${cafeId}/${order.riderId}/deliveryCount`] = increment(1);
        }
      }

      await update(ref(db), updates);
      setSelectedOrder(null);
      setSelectedRiderId("");
    } catch (error) {
      console.error(error);
      alert("Error updating order");
    }
  };

  const handleRiderAssignment = (e) => {
    e.preventDefault();
    if (!selectedRiderId) {
       alert("Please select a rider first.");
       return;
    }

    const selectedRider = availableRiders.find(r => r.id === selectedRiderId);
    if (!selectedRider) return;

    updateStatus(selectedOrder.id, "Out for Delivery", {
      riderId: selectedRider.id,
      riderName: selectedRider.name,
      riderPhone: selectedRider.phone
    });
  };

  const filteredOrders = orders.filter(o => 
    (filterStatus === "All" || o.status === filterStatus) &&
    (o.userName.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm))
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "Preparing": return "bg-orange-100 text-orange-600";
      case "Out for Delivery": 
      case "Ready for Pickup": return "bg-blue-100 text-blue-600";
      case "Delivered": 
      case "Collected": return "bg-green-100 text-green-600";
      default: return "bg-slate-100 text-slate-500";
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-uet-navy tracking-tight">Order Management</h1>
          <p className="text-slate-500 font-medium">Process and fulfill incoming requests</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
           {["All", "Preparing", "Out for Delivery", "Ready for Pickup", "Delivered", "Collected"].map((s) => (
             <button
               key={s}
               onClick={() => setFilterStatus(s)}
               className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap ${
                 filterStatus === s ? "bg-uet-navy text-white shadow-lg" : "text-slate-400 hover:text-uet-navy"
               }`}
             >
               {s}
             </button>
           ))}
        </div>
      </header>

      {/* Real-time Order Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
             <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4" />
             <h3 className="text-xl font-bold text-slate-400">No orders found</h3>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <motion.div 
              layout
              key={order.id}
              className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* ID & Status */}
                <div className="flex items-start space-x-4">
                  <div className={`p-4 rounded-2xl ${getStatusColor(order.status)}`}>
                    {order.status === "Preparing" && <Clock size={24} />}
                    {(order.status === "Out for Delivery" || order.status === "Ready for Pickup") && <Truck size={24} />}
                    {(order.status === "Delivered" || order.status === "Collected") && <CheckCircle2 size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Order #{order.id.slice(-6)}</span>
                       <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(order.status)}`}>{order.status}</span>
                       <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${order.orderType === 'takeaway' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                         {order.orderType === 'takeaway' ? 'Pre Order' : (order.orderType || 'Delivery')}
                       </span>
                    </div>
                    <h3 className="text-xl font-bold text-uet-navy mt-1">{order.userName}</h3>
                    <div className="flex items-center space-x-3 mt-2 text-slate-500 text-sm font-medium">
                       <div className="flex items-center"><Phone size={14} className="mr-1" /> {order.userPhone}</div>
                       <div className="flex items-center">
                         {order.orderType === 'takeaway' ? <ShoppingBag size={14} className="mr-1 text-purple-400" /> : <MapPin size={14} className="mr-1 text-red-400" />}
                         {order.orderType === 'takeaway' ? 'Pre Order Pickup' : order.address}
                       </div>
                    </div>
                  </div>
                </div>

                {/* Items & Summary */}
                <div className="flex-grow max-w-md bg-slate-50/50 p-4 rounded-2xl mx-2 border border-slate-100">
                   <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Order Items</div>
                   <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                           <span className="text-uet-navy font-bold leading-tight">{item.quantity}x <span className="font-medium text-slate-600">{item.name}</span></span>
                           <span className="text-slate-400 font-mono text-xs">Rs.{item.price * item.quantity}</span>
                        </div>
                      ))}
                   </div>
                   <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center">
                      <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-uet-gold bg-uet-navy px-2 py-0.5 rounded">
                         {order.paymentMethod === 'cod' ? <Banknote size={10} className="mr-1" /> : <CreditCard size={10} className="mr-1" />}
                         {order.paymentMethod}
                      </div>
                      <span className="font-bold text-uet-navy">Total Rs.{order.total}</span>
                   </div>
                </div>

                {/* Action Buttons */}
                 <div className="flex flex-col gap-2 min-w-[200px]">
                   {order.status === "Preparing" && (
                     <button 
                       onClick={() => {
                         if (order.orderType === 'takeaway') {
                           updateStatus(order.id, "Ready for Pickup");
                         } else {
                           setSelectedOrder(order);
                         }
                       }}
                       className="bg-uet-gold text-uet-navy py-3 px-6 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-gold hover:bg-white transition-all active:scale-95"
                     >
                       {order.orderType === 'takeaway' ? <ShoppingBag size={18} /> : <Truck size={18} />}
                       <span>{order.orderType === 'takeaway' ? 'Mark Pre Order Ready' : 'Dispatch Order'}</span>
                     </button>
                   )}
                   {order.status === "Out for Delivery" && (
                     <button 
                       onClick={() => updateStatus(order.id, "Delivered", { isPaid: true })}
                       className="bg-green-500 text-white py-3 px-6 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg hover:shadow-green-500/20 active:scale-95 transition-all outline-none"
                     >
                       <CheckCircle2 size={18} />
                       <span>Mark Delivered</span>
                     </button>
                   )}
                   {order.status === "Ready for Pickup" && (
                     <button 
                       onClick={() => updateStatus(order.id, "Collected", { isPaid: true })}
                       className="bg-green-500 text-white py-3 px-6 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg hover:shadow-green-500/20 active:scale-95 transition-all outline-none"
                     >
                       <CheckCircle2 size={18} />
                       <span>Mark Collected</span>
                     </button>
                   )}
                   <button className="text-slate-400 text-xs font-bold hover:text-uet-navy transition-all py-2">
                     Print Invoice
                   </button>
                </div>
              </div>

              {/* Rider Details if assigned */}
              {order.riderName && (
                <div className="bg-uet-navy text-white/80 px-8 py-3 flex items-center space-x-6 text-[11px] font-bold uppercase tracking-widest">
                   <div className="flex items-center"><Bike size={14} className="mr-2 text-uet-gold" /> Rider: {order.riderName}</div>
                   <div className="flex items-center"><Phone size={14} className="mr-2 text-uet-gold" /> Contact: {order.riderPhone}</div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Rider Assignment Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-uet-navy/40 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="bg-uet-navy p-6 pb-12">
                <div className="bg-uet-gold w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
                  <Truck size={28} className="text-uet-navy" />
                </div>
                <h2 className="text-2xl font-poppins font-bold text-white tracking-tight">Assign Rider</h2>
                <p className="text-blue-100/60 text-sm italic">Dispatching order for {selectedOrder.userName}</p>
              </div>

              <form onSubmit={handleRiderAssignment} className="p-8 -mt-8 bg-white rounded-t-[2rem] space-y-6">
                 <div>
                   <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Select Active Rider</label>
                   <div className="relative">
                     <select 
                       required
                       className="w-full bg-slate-50 border-none outline-none p-4 rounded-2xl text-uet-navy font-bold focus:ring-2 focus:ring-uet-gold transition-all appearance-none cursor-pointer"
                       value={selectedRiderId} 
                       onChange={(e) => setSelectedRiderId(e.target.value)}
                     >
                       <option value="" disabled>-- Choose a rider from your fleet --</option>
                       {availableRiders.map(rider => (
                         <option key={rider.id} value={rider.id}>
                           {rider.name} - {rider.phone}
                         </option>
                       ))}
                     </select>
                     <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                   </div>
                   {availableRiders.length === 0 && (
                     <p className="text-xs text-red-500 mt-2 font-medium">No riders available. Please add riders from the Riders tab.</p>
                   )}
                 </div>

                 <button 
                   type="submit"
                   className="w-full bg-uet-navy text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-navy hover:bg-uet-gold hover:text-uet-navy transition-all active:scale-95"
                 >
                   <span>Confirm & Dispatch</span>
                   <ChevronDown size={20} className="-rotate-90" />
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderManagement;
