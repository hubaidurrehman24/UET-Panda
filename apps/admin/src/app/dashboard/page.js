"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@uet-panda/shared-config";

export default function DashboardRoot() {
  const router = useRouter();
  const { userRole, loading } = useAuthContext();

  useEffect(() => {
    if (!loading) {
      if (userRole === "admin") {
        router.replace("/dashboard/orders");
      } else {
        router.replace("/login");
      }
    }
  }, [userRole, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-uet-gold"></div>
    </div>
  );
}
