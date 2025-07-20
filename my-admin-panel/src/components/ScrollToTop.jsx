// my-admin-panel/src/components/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop({ smooth = true, scrollContainerId, onScrollComplete }) {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollOptions = {
      top: 0,
      left: 0,
      behavior: smooth ? "smooth" : "auto",
    };

    if (scrollContainerId) {
      const container = document.getElementById(scrollContainerId);
      if (container) {
        container.scrollTo(scrollOptions);
        if (onScrollComplete) {
          // If smooth scrolling, listen for scroll end event
          if (smooth) {
            // Rough approximation: trigger callback after 300ms
            const timer = setTimeout(onScrollComplete, 300);
            return () => clearTimeout(timer);
          } else {
            onScrollComplete();
          }
        }
        return;
      }
    }

    // Default: scroll window
    if ("scrollBehavior" in document.documentElement.style) {
      window.scrollTo(scrollOptions);
      if (onScrollComplete) {
        if (smooth) {
          const timer = setTimeout(onScrollComplete, 300);
          return () => clearTimeout(timer);
        } else {
          onScrollComplete();
        }
      }
    } else {
      // Fallback for browsers that don't support smooth scroll
      window.scrollTo(0, 0);
      if (onScrollComplete) onScrollComplete();
    }
  }, [pathname, smooth, scrollContainerId, onScrollComplete]);

  return null;
}
