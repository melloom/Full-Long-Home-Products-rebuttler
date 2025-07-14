import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollToTop = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Immediate scroll to top
    window.scrollTo(0, 0);
    
    // Additional scroll to top after a short delay to ensure it works
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);
};

export const scrollToTop = () => {
  // Try multiple scroll methods to ensure it works
  window.scrollTo(0, 0);
  
  // Also try scrolling the document element
  if (document.documentElement) {
    document.documentElement.scrollTop = 0;
  }
  
  // Also try scrolling the body
  if (document.body) {
    document.body.scrollTop = 0;
  }
  
  // Try scrolling any scrollable containers
  const scrollableElements = document.querySelectorAll('.main-content, .layout, [style*="overflow"], [style*="scroll"]');
  scrollableElements.forEach(element => {
    if (element.scrollTop !== undefined) {
      element.scrollTop = 0;
    }
  });
}; 