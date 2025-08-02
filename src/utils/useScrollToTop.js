import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollToTop = () => {
  const location = useLocation();
  useEffect(() => {
    setTimeout(scrollToTop, 0);
    setTimeout(scrollToTop, 200);
  }, [location.pathname]);
};

export const scrollToTop = () => {
  // Window/document
  window.scrollTo(0, 0);
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;

  // Main content container
  const mainContent = document.querySelector('.main-content');
  if (mainContent) mainContent.scrollTop = 0;

  // All scrollable containers
  document.querySelectorAll('[data-scrollable], [style*="overflow"]').forEach(el => {
    if (el.scrollTop !== undefined) el.scrollTop = 0;
  });
}; 