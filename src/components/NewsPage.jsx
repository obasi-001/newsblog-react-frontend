import { useDeferredValue, useEffect, useMemo, useState } from "react";
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
  console.log(
    `Loading ${section.source} for category "${section.categorySlug || "all"}" and subcategory "${section.subcategorySlug || "none"}".`,
  );

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

    const items = toSectionItems(payload);
    console.log(
      `Loaded ${items.length} items for ${section.source} (${section.categorySlug || "all"} / ${section.subcategorySlug || "none"}).`,
    );

    return payload;
  } catch (error) {
    console.error(
      `Failed ${section.source} (${section.categorySlug || "all"} / ${section.subcategorySlug || "none"}):`,
      error,
    );
    return [];
  }
}

function NewsPage({ pageConfig }) {
  const location = useLocation();
  const showSidebar = Boolean(pageConfig.showSidebar);
  const [sections, setSections] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const searchQuery =
    new URLSearchParams(location.search).get("search")?.trim() ?? "";
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      setLoading(true);
      setError("");

      try {
        const resolvedSections = await Promise.all(
          pageConfig.sections.map(async (section) => {
            const payload = await loadSection(section);

            return {
              ...section,
              items: toSectionItems(payload),
              meta: toSectionMeta(payload),
            };
          }),
        );

        if (!cancelled) {
          setSections(resolvedSections);
        }
      } catch {
        if (!cancelled) {
          setError("We could not load this page structure right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [pageConfig]);

  useEffect(() => {
    if (!showSidebar) {
      setAllCategories([]);
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
                ? visibleSections.map((section) => (
                    <ContentSection
                      key={section.key}
                      title={section.title}
                      description={section.description}
                      items={section.items}
                      meta={section.meta}
                      type={section.type}
                      searchQuery={deferredSearchQuery}
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
