"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push(`/login?redirect=${pathname}`);
      } else if (requireAdmin && user.role !== "admin") {
        // Redirect to home if requires admin but user is not admin
        router.push("/");
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, loading, requireAdmin, router, pathname]);

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-uet-gold"></div>
      </div>
    );
  }

  return <>{children}</>;
}
