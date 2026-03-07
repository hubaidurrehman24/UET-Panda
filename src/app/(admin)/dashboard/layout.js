"use client";
import React from "react";
import Sidebar from "@/components/admin/Sidebar";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }) {
  const { user, userRole, loading } = useAuthContext();
  const router = useRouter();

  if (loading) return null;
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="flex min-h-screen bg-slate-50 font-sans">
        <Sidebar />
        <main className="flex-grow p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
