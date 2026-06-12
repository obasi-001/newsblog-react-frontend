import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Loader from "../components/Loader";
import { getVideoBySlug } from "../api/newsApi";
import { formatPublishedDate } from "../utils/formatters";

function VideoDetail() {
  const { videoSlug } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadVideo() {
      setLoading(true);

      try {
        const result = await getVideoBySlug(videoSlug);

        if (!cancelled) {
          setVideo(result);
        }
      } catch (error) {
        console.error("Failed to load video:", error);

        if (!cancelled) {
          setVideo(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadVideo();

    return () => {
      cancelled = true;
    };
  }, [videoSlug]);

  return (
    <>
      <Header searchTarget="/" />

      <main className="container py-4">
        {loading ? <Loader label="Loading video..." /> : null}

        {!loading && !video ? (
          <div className="alert alert-warning rounded-4 mb-0">
            We could not find that video.
          </div>
        ) : null}

        {!loading && video ? (
          <article className="bg-white border rounded-4 shadow-sm overflow-hidden">
            <div className="ratio ratio-16x9">
              <iframe
                src={video.embed_url || ""}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <div className="p-4 p-lg-5">
              <div className="d-flex flex-wrap gap-2 mb-3">
                <span className="badge text-bg-light border text-secondary">
                  {video.category_name}
                </span>

                <span className="badge text-bg-danger">
                  YouTube
                </span>
              </div>

              <h1 className="display-6 fw-semibold mb-3">
                {video.title}
              </h1>

              <p className="lead text-secondary">
                {video.description}
              </p>

              <p className="small text-secondary mb-4">
                Published {formatPublishedDate(video.published_date)}
              </p>

              <div className="d-flex gap-2 flex-wrap">
                <a
                  href={video.video_url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-danger"
                >
                  Watch on YouTube
                </a>

                <a
                  href={video.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-secondary"
                >
                  Open Source
                </a>
              </div>
            </div>
          </article>
        ) : null}
      </main>

      <Footer />
    </>
  );
}

export default VideoDetail;