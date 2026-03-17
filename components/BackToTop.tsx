import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface BackToTopProps {
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

const BackToTop: React.FC<BackToTopProps> = ({ scrollContainerRef }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Hiển thị nút khi cuộn xuống 300px
  useEffect(() => {
    const scrollContainer = scrollContainerRef?.current;
    if (!scrollContainer) return;

    const toggleVisibility = () => {
      if (scrollContainer.scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    scrollContainer.addEventListener('scroll', toggleVisibility);

    return () => {
      scrollContainer.removeEventListener('scroll', toggleVisibility);
    };
  }, [scrollContainerRef]);

  // Cuộn về đầu trang
  const scrollToTop = () => {
    const scrollContainer = scrollContainerRef?.current;
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-16 left-4 z-50 p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition-all duration-300 opacity-80 hover:opacity-100 hover:scale-105 active:scale-95 group"
          title="Về đầu trang"
          aria-label="Về đầu trang"
        >
          <ArrowUp size={20} className="group-hover:animate-bounce" />
        </button>
      )}
    </>
  );
};

export default BackToTop;
