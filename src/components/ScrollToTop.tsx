import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Instantly scroll to top on route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
    
    // Focus the first H1 for accessibility if it exists
    const h1 = document.querySelector('h1');
    if (h1) {
      h1.focus({ preventScroll: true });
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;