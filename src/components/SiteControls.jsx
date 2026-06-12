import { useEffect, useState } from "react";
import { FiArrowUp } from "react-icons/fi";

function SiteControls() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setShowBackToTop(window.scrollY > 320);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function handleBackToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="site-controls" aria-label="Page controls">
      {showBackToTop ? (
        <button
          type="button"
          className="site-control-button site-control-button--primary"
          onClick={handleBackToTop}
          aria-label="Back to top"
          title="Back to top"
        >
          <FiArrowUp size={18} />
        </button>
      ) : null}
    </div>
  );
}

export default SiteControls;
