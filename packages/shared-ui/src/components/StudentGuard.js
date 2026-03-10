"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@uet-panda/shared-config";

/**
 * StudentGuard: Prevents Admins from accessing student pages.
 * If a logged-in user is an Admin, they are redirected to their dashboard.
 */
export default function StudentGuard({ children }) {
  const { user, userRole, loading } = useAuthContext();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (user && userRole === "admin") {
        // Redirtect admin away from student pages
        router.replace("/dashboard/orders");
      } else {
        // User is either a student or not logged in - both are allowed to see student pages
        setIsAuthorized(true);
      }
    }
  }, [user, userRole, loading, router]);

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-uet-navy">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-uet-gold"></div>
      </div>
    );
  }

  return <>{children}</>;
}
