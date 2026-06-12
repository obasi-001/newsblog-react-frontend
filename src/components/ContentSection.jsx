import { useState, useSyncExternalStore } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import NewsCard from "./NewsCard";
import VideoCard from "./VideoCard";

function subscribeToMediaQuery(query, callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(query);
  mediaQuery.addEventListener("change", callback);

  return () => mediaQuery.removeEventListener("change", callback);
}

function getMediaQuerySnapshot(query) {
  return typeof window !== "undefined" && window.matchMedia(query).matches;
}

function useMediaQuery(query) {
  return useSyncExternalStore(
    (callback) => subscribeToMediaQuery(query, callback),
    () => getMediaQuerySnapshot(query),
    () => false,
  );
}

function ContentSection({
  title,
  description,
  items,
  type = "article",
  searchQuery = "",
}) {
  const visibleItems = Array.isArray(items) ? items : [];
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const isPhoneSize = useMediaQuery("(max-width: 575.98px)");
  const itemsPerPage = isPhoneSize ? Math.max(visibleItems.length, 1) : 4;
  const trimmedSearchQuery = searchQuery.trim();
  const countLabel = trimmedSearchQuery
    ? `${visibleItems.length} match${visibleItems.length === 1 ? "" : "es"} for "${trimmedSearchQuery}".`
    : description;
  const hasMultipleItems = visibleItems.length > itemsPerPage;
  const safeActiveItemIndex = Math.min(activeItemIndex, visibleItems.length - 1);
  const activePageStart =
    Math.floor(safeActiveItemIndex / itemsPerPage) * itemsPerPage;
  const activePageEnd = activePageStart + itemsPerPage;
  const lastPageStart =
    Math.max(Math.ceil(visibleItems.length / itemsPerPage) - 1, 0) * itemsPerPage;

  function showPreviousItem() {
    setActiveItemIndex((currentIndex) => {
      const currentPageStart =
        Math.floor(currentIndex / itemsPerPage) * itemsPerPage;

      return currentPageStart === 0
        ? lastPageStart
        : Math.max(currentPageStart - itemsPerPage, 0);
    });
  }

  function showNextItem() {
    setActiveItemIndex((currentIndex) => {
      const currentPageStart =
        Math.floor(currentIndex / itemsPerPage) * itemsPerPage;
      const nextPageStart = currentPageStart + itemsPerPage;

      return nextPageStart >= visibleItems.length ? 0 : nextPageStart;
    });
  }

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <section className={`content-section content-section--${type} bg-white border rounded-4 shadow-sm p-4`}>
      <div className="content-section__header d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-2 mb-4">
        <div>
          <h2 className="h4 mb-1">{title}</h2>
          <p className="text-secondary mb-0">{countLabel}</p>
        </div>
        <span className="badge text-bg-light border text-secondary text-uppercase">
          {type === "video" ? "Video Feed" : "Article Feed"}
        </span>
      </div>

      <div className="content-section__grid row g-4">
        {visibleItems.map((item, itemIndex) => (
          <div
            key={type === "video" ? item.slug : item.id}
            className={`content-section__item col-md-6 ${
              itemIndex >= activePageStart && itemIndex < activePageEnd ? "is-active" : ""
            }`.trim()}
          >
            {type === "video" ? (
              <VideoCard video={item} />
            ) : (
              <NewsCard article={item} />
            )}
          </div>
        ))}
      </div>

      {hasMultipleItems ? (
        <div className="content-section__pager">
          <button
            type="button"
            className="btn btn-outline-secondary rounded-pill px-3 py-2"
            onClick={showPreviousItem}
          >
            <FiChevronLeft aria-hidden="true" />
            Previous
          </button>
          <button
            type="button"
            className="btn btn-danger rounded-pill px-3 py-2"
            onClick={showNextItem}
          >
            Next
            <FiChevronRight aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default ContentSection;
