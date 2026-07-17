import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const scrollPositions = new Map();

function getScrollKey(location) {
  return location.key || `${location.pathname}${location.search}${location.hash}`;
}

function saveScrollPosition(location) {
  if (typeof window === "undefined") {
    return;
  }

  scrollPositions.set(getScrollKey(location), {
    x: window.scrollX,
    y: window.scrollY,
  });
}

function scrollWithoutAnimation(x, y) {
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;

  root.style.scrollBehavior = "auto";
  window.scrollTo(x, y);
  root.style.scrollBehavior = previousScrollBehavior;
}

function restoreScrollPosition(location) {
  if (typeof window === "undefined") {
    return () => {};
  }

  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));

    if (target) {
      target.scrollIntoView({ block: "start" });
    }

    return () => {};
  }

  const position = scrollPositions.get(getScrollKey(location)) ?? { x: 0, y: 0 };
  const restore = () => scrollWithoutAnimation(position.x, position.y);
  const animationFrame = window.requestAnimationFrame(restore);
  const shortRetry = window.setTimeout(restore, 80);
  const layoutRetry = window.setTimeout(restore, 240);

  return () => {
    window.cancelAnimationFrame(animationFrame);
    window.clearTimeout(shortRetry);
    window.clearTimeout(layoutRetry);
  };
}

function ScrollRestoration() {
  const location = useLocation();

  useLayoutEffect(() => {
    const handlePageHide = () => saveScrollPosition(location);
    const cleanupRestore = restoreScrollPosition(location);

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      cleanupRestore();
      saveScrollPosition(location);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [location]);

  return null;
}

export default ScrollRestoration;
