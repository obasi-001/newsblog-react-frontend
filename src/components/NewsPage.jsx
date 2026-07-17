import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import Loader from "./Loader";
import SportNav from "./SportNav";
import ContentSection from "./ContentSection";
import {
  getArticles,
  getArticlesByCategory,
  getCategories,
  getLatestArticles,
  getTrendingArticles,
  getVideos,
  getVideosByCategory,
} from "../api/newsApi";

function toSectionItems(payload) {
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

function toSectionMeta(payload) {
  if (Array.isArray(payload)) {
    return null;
  }

  return {
    count: payload.count,
    next: payload.next,
    previous: payload.previous,
  };
}

const PAGE_CACHE_TTL_MS = 2 * 60 * 1000;
const HOME_COLLECTION_PAGE_SIZE = 25;
const pageMemoryCache = new Map();

function getPageCacheKey(pageConfig) {
  const sectionsKey = pageConfig.sections
    .map((section) => [
      section.key,
      section.source,
      section.categorySlug ?? "",
      section.subcategorySlug ?? "",
      section.limit ?? "",
      section.page ?? "",
      section.type ?? "article",
    ].join(":"))
    .join("|");

  return `${pageConfig.slug}:${sectionsKey}`;
}

function readCachedPage(cacheKey) {
  return pageMemoryCache.get(cacheKey) ?? null;
}

function writeCachedPage(cacheKey, sections) {
  pageMemoryCache.set(cacheKey, {
    sections,
    updatedAt: Date.now(),
  });
}

function isCachedPageFresh(cachedPage) {
  return Boolean(cachedPage) && Date.now() - cachedPage.updatedAt < PAGE_CACHE_TTL_MS;
}

function scheduleStateUpdate(callback) {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(callback);
    return;
  }

  Promise.resolve().then(callback);
}

function slugifyLocal(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getItemCategorySlug(item) {
  return slugifyLocal(
    item.category?.slug
      ?? item.category_slug
      ?? item.category_name
      ?? item.category?.name,
  );
}

function getItemSubcategorySlugs(item) {
  return [
    item.subcategory?.slug,
    item.subcategory_slug,
    item.sports_unit_slug,
    item.sport_slug,
  ].map(slugifyLocal).filter(Boolean);
}

function comparePublishedNewestFirst(a, b) {
  return new Date(b.published_at ?? b.published_date ?? 0)
    - new Date(a.published_at ?? a.published_date ?? 0);
}

function filterAggregateItems(items, section) {
  return items.filter((item) => {
    if (section.categorySlug && getItemCategorySlug(item) !== slugifyLocal(section.categorySlug)) {
      return false;
    }

    if (section.subcategorySlug) {
      return getItemSubcategorySlugs(item).includes(slugifyLocal(section.subcategorySlug));
    }

    return true;
  });
}

function takeSectionLimit(items, limit) {
  const normalizedLimit = Number(limit);

  return Number.isFinite(normalizedLimit) && normalizedLimit > 0
    ? items.slice(0, normalizedLimit)
    : items;
}

function buildAggregateSection(section, articles, videos) {
  const sourceItems = section.type === "video" ? videos : articles;
  let filteredItems = filterAggregateItems(sourceItems, section);

  if (section.source === "latestArticles" || section.type === "video") {
    filteredItems = [...filteredItems].sort(comparePublishedNewestFirst);
  } else if (section.source === "trendingArticles") {
    filteredItems = [...filteredItems].sort(
      (a, b) => (b.likes_count || 0) - (a.likes_count || 0),
    );
  }

  return {
    ...section,
    items: takeSectionLimit(filteredItems, section.limit),
    meta: {
      count: filteredItems.length,
      next: null,
      previous: null,
    },
  };
}

function matchesSearch(item, query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableFields = [
    item.title,
    item.excerpt,
    item.description,
    item.author,
    item.source,
    item.image_alt,
    item.category?.name,
    item.category?.slug,
    Array.isArray(item.body) ? item.body.join(" ") : "",
  ];

  return searchableFields.some((field) =>
    String(field ?? "").toLowerCase().includes(normalizedQuery),
  );
}

async function loadSection(section) {
  try {
    let payload;

    switch (section.source) {
      case "latestArticles":
        payload = await getLatestArticles({
          categorySlug: section.categorySlug,
          subcategorySlug: section.subcategorySlug,
          page: section.page ?? 1,
          pageSize: section.limit || 10,
          limit: section.limit || 10,
        });
        break;

      case "trendingArticles":
        payload = await getTrendingArticles({
          categorySlug: section.categorySlug,
          subcategorySlug: section.subcategorySlug,
          page: section.page ?? 1,
          pageSize: section.limit || 6,
          limit: section.limit || 6,
        });
        break;

      case "categoryArticles":
        payload = await getArticlesByCategory(section.categorySlug, {
          subcategorySlug: section.subcategorySlug,
          page: section.page ?? 1,
          pageSize: section.limit || 12,
        });
        break;

      case "articles":
        payload = await getArticles({
          categorySlug: section.categorySlug,
          subcategorySlug: section.subcategorySlug,
          page: section.page ?? 1,
          pageSize: section.limit || 12,
        });
        break;

      case "categoryVideos":
        payload = await getVideosByCategory(section.categorySlug, {
          subcategorySlug: section.subcategorySlug,
          page: section.page ?? 1,
          pageSize: section.limit || 6,
          limit: section.limit || 6,
        });
        break;

      case "videos":
        payload = await getVideos({
          categorySlug: section.categorySlug,
          subcategorySlug: section.subcategorySlug,
          page: section.page ?? 1,
          pageSize: section.limit || 6,
          limit: section.limit || 6,
        });
        break;

      default:
        payload = await getArticles({ limit: 10 });
    }

    return payload;
  } catch (error) {
    console.error(
      `Failed ${section.source} (${section.categorySlug || "all"} / ${section.subcategorySlug || "none"}):`,
      error,
    );
    return [];
  }
}

async function loadHomeSections(pageConfig) {
  const [articlesResult, videosResult] = await Promise.allSettled([
    getArticles({ allPages: true, pageSize: HOME_COLLECTION_PAGE_SIZE }),
    getVideos({ allPages: true, pageSize: HOME_COLLECTION_PAGE_SIZE }),
  ]);

  if (articlesResult.status === "rejected") {
    console.error("Failed to load cached homepage article collection:", articlesResult.reason);
  }

  if (videosResult.status === "rejected") {
    console.error("Failed to load cached homepage video collection:", videosResult.reason);
  }

  const articles = articlesResult.status === "fulfilled"
    ? toSectionItems(articlesResult.value)
    : [];
  const videos = videosResult.status === "fulfilled"
    ? toSectionItems(videosResult.value)
    : [];

  return pageConfig.sections.map((section) =>
    buildAggregateSection(section, articles, videos),
  );
}

async function loadPageSections(pageConfig) {
  if (pageConfig.slug === "home") {
    return loadHomeSections(pageConfig);
  }

  return Promise.all(
    pageConfig.sections.map(async (section) => {
      const payload = await loadSection(section);

      return {
        ...section,
        items: toSectionItems(payload),
        meta: toSectionMeta(payload),
      };
    }),
  );
}

function NewsPage({ pageConfig }) {
  const location = useLocation();
  const showSidebar = Boolean(pageConfig.showSidebar);
  const pageCacheKey = useMemo(() => getPageCacheKey(pageConfig), [pageConfig]);
  const initialCachedPage = readCachedPage(pageCacheKey);
  const [sections, setSections] = useState(() => initialCachedPage?.sections ?? []);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(() => !initialCachedPage?.sections);
  const [error, setError] = useState("");

  const searchQuery = useMemo(
    () => new URLSearchParams(location.search).get("search")?.trim() ?? "",
    [location.search],
  );
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    let cancelled = false;
    const cachedPage = readCachedPage(pageCacheKey);
    const hasCachedSections = Array.isArray(cachedPage?.sections);

    if (hasCachedSections) {
      scheduleStateUpdate(() => {
        if (!cancelled) {
          setSections(cachedPage.sections);
          setLoading(false);
          setError("");
        }
      });

      if (isCachedPageFresh(cachedPage)) {
        return () => {
          cancelled = true;
        };
      }
    } else {
      scheduleStateUpdate(() => {
        if (!cancelled) {
          setSections([]);
          setLoading(true);
          setError("");
        }
      });
    }

    async function loadPage() {
      try {
        const resolvedSections = await loadPageSections(pageConfig);

        if (!cancelled) {
          writeCachedPage(pageCacheKey, resolvedSections);

          const commitSections = () => {
            setSections(resolvedSections);
            setError("");
            setLoading(false);
          };

          if (hasCachedSections) {
            startTransition(commitSections);
          } else {
            commitSections();
          }
        }
      } catch (loadError) {
        console.error("Failed to load page sections:", loadError);

        if (!cancelled && !hasCachedSections) {
          setError("We could not load this page structure right now.");
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [pageCacheKey, pageConfig]);

  useEffect(() => {
    if (!showSidebar) {
      return undefined;
    }

    let cancelled = false;

    async function loadCategories() {
      try {
        const categories = await getCategories();
        const uniqueCategories = Array.from(
          new Map(categories.map((cat) => [cat.slug, cat])).values(),
        );

        if (!cancelled) {
          setAllCategories(uniqueCategories);
        }
      } catch (loadError) {
        console.error("Failed to load categories:", loadError);

        if (!cancelled) {
          setAllCategories([]);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, [showSidebar]);

  const visibleSections = useMemo(() => {
    if (!deferredSearchQuery) {
      return sections;
    }

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          matchesSearch(item, deferredSearchQuery),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [deferredSearchQuery, sections]);

  const totalMatches = useMemo(
    () => visibleSections.reduce(
      (matchCount, section) => matchCount + section.items.length,
      0,
    ),
    [visibleSections],
  );

  return (
    <>
      <Header />

      <main className="news-shell container-fluid py-4">
        <div className="row g-4">
          {showSidebar ? (
            <aside className="col-lg-3">
              <Sidebar categories={allCategories} />
            </aside>
          ) : null}

          <section className={showSidebar ? "col-lg-9" : "col-12"}>
            <div className="page-hero bg-white border rounded-4 shadow-sm p-4 p-lg-5">
              <span className="badge text-bg-danger rounded-pill px-3 py-2">
                {pageConfig.kicker}
              </span>
              <h1 className="display-6 fw-semibold mt-3 mb-2">
                {pageConfig.title}
              </h1>
              <p className="lead text-secondary mb-4">{pageConfig.description}</p>

              <div className="d-flex flex-wrap gap-2">
                {pageConfig.highlights.map((highlight) => (
                  <span key={highlight} className="metric-pill">
                    {highlight}
                  </span>
                ))}
              </div>
            </div>

            {pageConfig.showSportNav ? (
              <div className="mt-3">
                <SportNav />
              </div>
            ) : null}

            {deferredSearchQuery ? (
              <div className="alert alert-light border rounded-4 mt-4 mb-0">
                {totalMatches > 0 ? (
                  <>
                    Showing {totalMatches} result{totalMatches === 1 ? "" : "s"} for{" "}
                    <strong>{deferredSearchQuery}</strong>.
                  </>
                ) : (
                  <>
                    No stories or videos matched <strong>{deferredSearchQuery}</strong>{" "}
                    on this page.
                  </>
                )}
              </div>
            ) : null}

            <div className="news-feed-stack d-flex flex-column gap-4 mt-4">
              {loading ? <Loader /> : null}

              {error ? (
                <div className="alert alert-danger rounded-4 mb-0" role="alert">
                  {error}
                </div>
              ) : null}

              {!loading && !error
                ? visibleSections.map((section, sectionIndex) => (
                    <ContentSection
                      key={section.key}
                      title={section.title}
                      description={section.description}
                      items={section.items}
                      meta={section.meta}
                      type={section.type}
                      searchQuery={deferredSearchQuery}
                      priorityImages={sectionIndex === 0 && !deferredSearchQuery}
                      scrollAnchorScope={section.key}
                    />
                  ))
                : null}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default NewsPage;
