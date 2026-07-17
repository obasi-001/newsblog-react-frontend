import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  getRememberedScrollAnchor,
  getRememberedScrollPosition,
  rememberCurrentScrollPosition,
} from "../utils/scrollMemory";

function scrollWithoutAnimation(x, y) {
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;

  root.style.scrollBehavior = "auto";
  window.scrollTo(x, y);
  root.style.scrollBehavior = previousScrollBehavior;
}

function findScrollAnchor(anchorId) {
  return Array.from(document.querySelectorAll("[data-scroll-anchor]"))
    .find((element) => element.dataset.scrollAnchor === anchorId);
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

  const position = getRememberedScrollPosition(location);
  const anchor = getRememberedScrollAnchor(location);
  const restore = () => {
    if (anchor) {
      const element = findScrollAnchor(anchor.id);

      if (element) {
        const rect = element.getBoundingClientRect();
        scrollWithoutAnimation(
          position.x,
          Math.max(0, window.scrollY + rect.top - anchor.viewportTop),
        );
        return;
      }
    }

    scrollWithoutAnimation(position.x, position.y);
  };
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
    const handlePageHide = () => rememberCurrentScrollPosition(location);
    const cleanupRestore = restoreScrollPosition(location);

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      cleanupRestore();
      rememberCurrentScrollPosition(location);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [location]);

  return null;
}

export default ScrollRestoration;
