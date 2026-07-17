const scrollPositions = new Map();
const scrollAnchors = new Map();

function getEntryScrollKey(location) {
  return location.key ? `entry:${location.key}` : "";
}

function getPathScrollKey(location) {
  return `path:${location.pathname}${location.search}`;
}

function isFeedRoute(location) {
  return !location.pathname.startsWith("/articles/")
    && !location.pathname.startsWith("/videos/");
}

export function rememberScrollPosition(location, position) {
  if (!location) {
    return;
  }

  const entryKey = getEntryScrollKey(location);

  if (entryKey) {
    scrollPositions.set(entryKey, position);
  }

  if (isFeedRoute(location)) {
    scrollPositions.set(getPathScrollKey(location), position);
  }
}

export function rememberCurrentScrollPosition(location) {
  if (typeof window === "undefined") {
    return;
  }

  rememberScrollPosition(location, {
    x: window.scrollX,
    y: window.scrollY,
  });
}

export function rememberCurrentScrollAnchor(location, anchorId, element) {
  if (typeof window === "undefined" || !isFeedRoute(location) || !anchorId || !element) {
    rememberCurrentScrollPosition(location);
    return;
  }

  const rect = element.getBoundingClientRect();

  rememberCurrentScrollPosition(location);
  scrollAnchors.set(getPathScrollKey(location), {
    id: anchorId,
    viewportTop: rect.top,
    viewportLeft: rect.left,
  });
}

export function getRememberedScrollPosition(location) {
  const entryKey = getEntryScrollKey(location);

  return (entryKey ? scrollPositions.get(entryKey) : null)
    ?? (isFeedRoute(location) ? scrollPositions.get(getPathScrollKey(location)) : null)
    ?? { x: 0, y: 0 };
}

export function getRememberedScrollAnchor(location) {
  return isFeedRoute(location) ? scrollAnchors.get(getPathScrollKey(location)) : null;
}
