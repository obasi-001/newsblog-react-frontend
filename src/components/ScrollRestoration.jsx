import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  getRememberedScrollAnchor,
  getRememberedScrollPosition,
  rememberCurrentScrollPosition,
} from "../utils/scrollMemory";

const ANCHOR_RESTORE_DURATION_MS = 1400;
const ANCHOR_RESTORE_TOLERANCE_PX = 0.5;

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

function createAnchorRestoreLoop(anchor, fallbackPosition) {
  const startedAt = performance.now();
  let animationFrame = 0;
  let cancelled = false;

  function restore() {
    if (cancelled) {
      return;
    }

    const element = findScrollAnchor(anchor.id);

    if (!element) {
      scrollWithoutAnimation(fallbackPosition.x, fallbackPosition.y);
    } else {
      const rect = element.getBoundingClientRect();
      const nextX = window.scrollX + rect.left - anchor.viewportLeft;
      const nextY = window.scrollY + rect.top - anchor.viewportTop;

      if (
        Math.abs(nextX - window.scrollX) > ANCHOR_RESTORE_TOLERANCE_PX
        || Math.abs(nextY - window.scrollY) > ANCHOR_RESTORE_TOLERANCE_PX
      ) {
        scrollWithoutAnimation(Math.max(0, nextX), Math.max(0, nextY));
      }
    }

    if (performance.now() - startedAt < ANCHOR_RESTORE_DURATION_MS) {
      animationFrame = window.requestAnimationFrame(restore);
    }
  }

  animationFrame = window.requestAnimationFrame(restore);

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(animationFrame);
  };
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

  if (anchor) {
    return createAnchorRestoreLoop(anchor, position);
  }

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
