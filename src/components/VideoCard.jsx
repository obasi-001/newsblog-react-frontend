import { Link } from "react-router-dom";
import { memo } from "react";
import { formatPublishedDate } from "../utils/formatters";

function VideoCard({ video }) {
  const thumbnailUrl = video.thumbnail_url;

  return (
    <article
      className={`video-card ${
        thumbnailUrl
          ? "video-card--has-image"
          : "video-card--no-image"
      } card border-0 shadow-sm h-100 overflow-hidden`}
    >
      {thumbnailUrl ? (
        <div className="position-relative">
          <img
            src={thumbnailUrl}
            className="video-card-media"
            alt={video.title}
            loading="lazy"
            decoding="async"
          />

          <div
            className="position-absolute top-50 start-50 translate-middle text-white"
            style={{
              fontSize: "3rem",
              pointerEvents: "none",
            }}
          >
            ▶
          </div>
        </div>
      ) : null}

      <div className="card-body d-flex flex-column">
        <div className="video-card__meta d-flex justify-content-between align-items-center gap-2 mb-3">
          <span className="badge text-bg-light border text-secondary">
            {video.category_name}
          </span>

          <span className="small text-secondary">
            YouTube
          </span>
        </div>

        <Link
          to={`/videos/${video.slug}`}
          className="text-dark text-decoration-none stretched-link"
        >
          <h3 className="video-card__title h5 fw-semibold">
            {video.title}
          </h3>
        </Link>

        {video.description ? (
          <p className="video-card__description text-secondary small">
            {video.description}
          </p>
        ) : null}

        <p className="video-card__footer small text-secondary mb-0 mt-auto">
          Published {formatPublishedDate(video.published_date)}
        </p>
      </div>
    </article>
  );
}

export default memo(VideoCard);
