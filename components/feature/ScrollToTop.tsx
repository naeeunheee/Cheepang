import { useState, useEffect } from 'react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-36 right-4 md:bottom-24 md:right-6 z-40 w-11 h-11 bg-white text-[#2B5F9E] border border-gray-200 rounded-full shadow-md hover:bg-[#2B5F9E] hover:text-white hover:border-[#2B5F9E] transition-all duration-300 flex items-center justify-center cursor-pointer group hover:scale-110"
      aria-label="맨 위로 이동"
    >
      <i className="ri-arrow-up-line text-lg"></i>
    </button>
  );
}
