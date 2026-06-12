import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Loader from "../components/Loader";
import VideoCard from "../components/VideoCard";
import { getGroupedVideos } from "../api/newsApi";
import { primaryNavItems } from "../config/pageConfig";

const SPORTS_VIDEO_UNIT_SECTIONS = [
  { label: "Football", slug: "football" },
  { label: "Basketball", slug: "basketball" },
  { label: "Tennis", slug: "tennis" },
  { label: "Boxing", slug: "boxing" },
  { label: "Formula 1", slug: "formula-1" },
  { label: "Golf", slug: "golf" },
  { label: "Olympics", slug: "olympics" },
];

const VIDEO_CATEGORY_SECTIONS = primaryNavItems
  .filter((item) => item.path !== "/" && item.path !== "/videos")
  .flatMap((item) => {
    const slug = item.path.replace(/^\//, "");
    const section = {
      label: item.label,
      slug,
    };

    return slug === "sports"
      ? [section, ...SPORTS_VIDEO_UNIT_SECTIONS]
      : [section];
  });

function formatCategoryName(category) {
  return String(category ?? "Uncategorized")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function VideosHome() {
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await getGroupedVideos({ allPages: true, limit: 100 });

        if (!cancelled) {
          setGroups(data);
        }
      } catch (loadError) {
        console.error("Failed to load video categories:", loadError);

        if (!cancelled) {
          setGroups({});
          setError("We could not load videos right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const knownCategorySlugs = new Set(
    VIDEO_CATEGORY_SECTIONS.map((section) => section.slug),
  );
  const groupedSections = [
    ...VIDEO_CATEGORY_SECTIONS.map((section) => ({
      ...section,
      videos: groups[section.slug] ?? [],
    })),
    ...Object.entries(groups)
      .filter(
        ([category, videos]) =>
          !knownCategorySlugs.has(category) &&
          Array.isArray(videos) &&
          videos.length > 0,
      )
      .map(([category, videos]) => ({
        label: formatCategoryName(category),
        slug: category,
        videos,
      })),
  ].filter((section) => section.videos.length > 0);

  return (
    <>
      <Header searchTarget="/videos" />

      <main className="news-shell videos-home container-fluid py-4">
        <div className="container">
          <div className="page-hero bg-white border rounded-4 shadow-sm p-4 p-lg-5">
            <span className="badge text-bg-danger rounded-pill px-3 py-2">
              NATG TV
            </span>
            <h1 className="display-6 fw-semibold mt-3 mb-2">
              Videos
            </h1>
            <p className="lead text-secondary mb-0">
              Latest video coverage grouped by newsroom category.
            </p>
          </div>

          <div className="news-feed-stack d-flex flex-column gap-4 mt-4">
            {loading ? <Loader label="Loading video categories..." /> : null}

            {error ? (
              <div className="alert alert-danger rounded-4 mb-0" role="alert">
                {error}
              </div>
            ) : null}

            {!loading && !error && groupedSections.length === 0 ? (
              <div className="alert alert-light border rounded-4 mb-0">
                No videos are available yet.
              </div>
            ) : null}

            {!loading && !error
              ? groupedSections.map((section) => (
                  <section
                    key={section.slug}
                    className="content-section content-section--video bg-white border rounded-4 shadow-sm p-4"
                  >
                    <div className="content-section__header d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-2 mb-4">
                      <div>
                        <h2 className="h4 mb-1">
                          {section.label} Videos
                        </h2>
                        <p className="text-secondary mb-0">
                          {section.videos.length} latest video{section.videos.length === 1 ? "" : "s"}.
                        </p>
                      </div>
                      <span className="badge text-bg-light border text-secondary text-uppercase">
                        Video Feed
                      </span>
                    </div>

                    <div className="content-section__grid row g-4">
                      {section.videos.map((video) => (
                        <div
                          key={video.slug}
                          className="content-section__item col-xl-3 col-lg-4 col-md-6"
                        >
                          <VideoCard video={video} />
                        </div>
                      ))}
                    </div>
                  </section>
                ))
              : null}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default VideosHome;
