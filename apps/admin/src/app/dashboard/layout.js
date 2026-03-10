"use client";
import React from "react";
import Sidebar from "../../components/Sidebar";
import { ProtectedRoute } from "@uet-panda/shared-ui";
import { useAuthContext } from "@uet-panda/shared-config";
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
