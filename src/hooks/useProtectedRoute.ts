import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const PROTECTED_ROUTES = ["/profile", "/votes"];

export function useProtectedRoute() {
  const pathname = usePathname();
  const { isAuthenticated, isInitialized } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Only proceed if auth is initialized
    if (!isInitialized) return;

    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    if (isProtectedRoute && !isAuthenticated) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [pathname, isAuthenticated, isInitialized]);

  // Also expose methods to manually control the modal
  const openAuthModal = () => setShowAuthModal(true);
  const closeAuthModal = () => setShowAuthModal(false);

  return {
    showAuthModal,
    isProtectedRoute: PROTECTED_ROUTES.some((route) =>
      pathname.startsWith(route)
    ),
    openAuthModal,
    closeAuthModal,
  };
}
