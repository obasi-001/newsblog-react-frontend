import { Link } from "react-router-dom";
import { memo, useState } from "react";
import EngagementBar from "./EngagementBar";
import { resolveMediaUrl } from "../api/newsApi";
import { getCategoryPath } from "../config/pageConfig";
import { formatPublishedDate } from "../utils/formatters";

function NewsCard({ article }) {
  const imageUrl = resolveMediaUrl(article.image);
  const placeholderImage = "/images/news-placeholder.jpg";
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const imageFailed = Boolean(imageUrl && failedImageUrl === imageUrl);
  const usesPlaceholderImage = !imageUrl || imageFailed;
  const cardImageUrl = usesPlaceholderImage ? placeholderImage : imageUrl;
  const articleAuthor = String(article.author ?? "").trim();
  const articleSource = String(article.source ?? "").trim();
  const hasDistinctAuthor = Boolean(
    articleAuthor
    && (!articleSource || articleAuthor.toLowerCase() !== articleSource.toLowerCase()),
  );
  const hasByline = Boolean(articleAuthor || articleSource);

  const handleImageError = () => {
    if (imageUrl && !imageFailed) {
      setFailedImageUrl(imageUrl);
    }
  };

  return (
    <article
      className={`news-card ${
        imageUrl ? "news-card--has-image" : "news-card--no-image"
      } card border-0 shadow-sm h-100 overflow-hidden`}
    >
      <div
        className={`news-card-media-frame${
          usesPlaceholderImage ? " news-card-media-frame--placeholder" : ""
        }`}
        style={
          usesPlaceholderImage
            ? { backgroundImage: `url("${placeholderImage}")` }
            : undefined
        }
      >
        <img
          src={cardImageUrl}
          className={`news-card-media${
            usesPlaceholderImage ? " news-card-media--placeholder" : ""
          }`}
          alt={article.image_alt || article.title}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
        />
      </div>

      <div className="card-body d-flex flex-column">
        <div className="news-card__meta d-flex justify-content-between align-items-center gap-2 mb-3">
          <Link
            to={getCategoryPath(article.category.slug)}
            className="badge text-bg-light border text-decoration-none text-secondary"
          >
            {article.category.name}
          </Link>

          <span className="small text-secondary">
            {formatPublishedDate(article.published_at)}
          </span>
        </div>

        <Link
          to={`/articles/${article.id}`}
          className="text-dark text-decoration-none stretched-link"
        >
          <h3 className="news-card__title h5 fw-semibold">
            {article.title}
          </h3>
        </Link>

        <p className="news-card__excerpt text-secondary small mb-3">
          {article.excerpt}
        </p>

        <div className="news-card__footer mt-auto">
          {hasByline ? (
            <p className="small mb-2">
              {hasDistinctAuthor ? (
                <>
                  <span className="fw-semibold">
                    {articleAuthor}
                  </span>
                  {articleSource ? (
                    <span className="text-secondary">
                      {" "}for {articleSource}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="fw-semibold">
                  {articleSource || articleAuthor}
                </span>
              )}
            </p>
          ) : null}

          <div className="position-relative z-1">
            <EngagementBar
              articleId={article.id}
              articleTitle={article.title}
              articlePath={`/articles/${article.id}`}
              likesCount={article.likes_count}
              commentsCount={article.comments_count}
              sharesCount={article.shares_count}
              commentHref={`/articles/${article.id}#comments`}
              compact
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export default memo(NewsCard);
