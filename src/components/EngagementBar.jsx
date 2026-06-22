import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import { FiCheck, FiCopy, FiHeart, FiLink, FiMail, FiMessageCircle, FiShare2 } from "react-icons/fi";
import { hasStoredAuthToken } from "../auth";
import { registerArticleShare, sendArticleLike } from "../api/newsApi";
import { getApiErrorMessage } from "../utils/apiErrors";
import { formatCompactCount } from "../utils/formatters";

const LIKED_ARTICLES_STORAGE_KEY = "mynews-liked-articles";

function readLikedArticles() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(LIKED_ARTICLES_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch {
    return {};
  }
}

function writeLikedArticles(value) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    LIKED_ARTICLES_STORAGE_KEY,
    JSON.stringify(value),
  );
}

function getAbsoluteArticleUrl(articlePath = "", articleId) {
  const fallbackPath = articlePath || `/articles/${articleId ?? ""}`;

  if (typeof window === "undefined") {
    return fallbackPath;
  }

  return new URL(fallbackPath, window.location.origin).toString();
}

function buildShareTargets(articleUrl, articleTitle) {
  const encodedUrl = encodeURIComponent(articleUrl);
  const encodedTitle = encodeURIComponent(articleTitle);
  const emailSubject = encodeURIComponent(`Interesting read: ${articleTitle}`);
  const emailBody = encodeURIComponent(`${articleTitle}\n\n${articleUrl}`);

  return [
    {
      id: "native",
      label: "Device share",
      icon: FiShare2,
      available: typeof navigator !== "undefined" && typeof navigator.share === "function",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      icon: FiMessageCircle,
    },
    {
      id: "x",
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: FiShare2,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: FiShare2,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: FiLink,
    },
    {
      id: "email",
      label: "Email",
      href: `mailto:?subject=${emailSubject}&body=${emailBody}`,
      icon: FiMail,
    },
    {
      id: "copy",
      label: "Copy link",
      icon: FiCopy,
    },
  ].filter((target) => target.available !== false);
}

async function copyTextToClipboard(value) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const fallbackElement = document.createElement("textarea");
  fallbackElement.value = value;
  fallbackElement.setAttribute("readonly", "true");
  fallbackElement.style.position = "absolute";
  fallbackElement.style.left = "-9999px";
  document.body.appendChild(fallbackElement);
  fallbackElement.select();
  document.execCommand("copy");
  document.body.removeChild(fallbackElement);
}

function EngagementBar({
  articleId,
  articleTitle = "MyNews article",
  articlePath = "",
  likesCount = 0,
  commentsCount = 0,
  sharesCount = 0,
  commentHref = "",
  onCommentClick,
  compact = false,
}) {
  const storageKey = useMemo(() => String(articleId ?? "unknown"), [articleId]);
  const articleUrl = useMemo(
    () => getAbsoluteArticleUrl(articlePath, articleId),
    [articleId, articlePath],
  );
  const shareTargets = useMemo(
    () => buildShareTargets(articleUrl, articleTitle),
    [articleTitle, articleUrl],
  );
  const shareMenuRef = useRef(null);
  const [liked, setLiked] = useState(() => Boolean(readLikedArticles()[storageKey]));
  const [displayLikesCount, setDisplayLikesCount] = useState(Number(likesCount || 0));
  const [displaySharesCount, setDisplaySharesCount] = useState(Number(sharesCount || 0));
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");
  const [shareError, setShareError] = useState("");
  const [likeError, setLikeError] = useState("");
  const [isSubmittingLike, setIsSubmittingLike] = useState(false);
  const [isSubmittingShare, setIsSubmittingShare] = useState(false);

  useEffect(() => {
    setLiked(Boolean(readLikedArticles()[storageKey]));
    setDisplayLikesCount(Number(likesCount || 0));
    setDisplaySharesCount(Number(sharesCount || 0));
    setShareMenuOpen(false);
    setShareFeedback("");
    setShareError("");
    setLikeError("");
  }, [articleId, likesCount, sharesCount, storageKey]);

  useEffect(() => {
    if (!shareMenuOpen) {
      return undefined;
    }

    function handleOutsideClick(event) {
      if (!shareMenuRef.current?.contains(event.target)) {
        setShareMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setShareMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [shareMenuOpen]);

  async function handleLike() {
    if (!articleId || isSubmittingLike) {
      return;
    }

    if (!hasStoredAuthToken()) {
      setLikeError("Please log in or subscribe before liking articles.");
      return;
    }

    const shouldLike = !liked;

    setIsSubmittingLike(true);
    setLikeError("");

    try {
      const response = await sendArticleLike(
        articleId,
        shouldLike,
        {
          likes_count: displayLikesCount,
          comments_count: commentsCount,
          shares_count: displaySharesCount,
        },
      );

      const nextLikedArticles = readLikedArticles();
      if (shouldLike) {
        nextLikedArticles[storageKey] = true;
      } else {
        delete nextLikedArticles[storageKey];
      }
      writeLikedArticles(nextLikedArticles);

      setLiked(shouldLike);
      setDisplayLikesCount(
        response.likes_count > 0
          ? response.likes_count
          : Math.max(displayLikesCount + (shouldLike ? 1 : -1), 0),
      );
    } catch (error) {
      setLikeError(getApiErrorMessage(
        error,
        liked
          ? "We could not remove your like right now."
          : "We could not record your like right now.",
      ));
    } finally {
      setIsSubmittingLike(false);
    }
  }

  async function recordShare(destination) {
    try {
      const response = await registerArticleShare(
        articleId,
        {
          destination,
          title: articleTitle,
          url: articleUrl,
        },
        {
          likes_count: displayLikesCount,
          comments_count: commentsCount,
          shares_count: displaySharesCount,
        },
      );

      setDisplaySharesCount(
        response.shares_count > 0 ? response.shares_count : displaySharesCount + 1,
      );
      setShareError("");
    } catch (error) {
      setShareError(getApiErrorMessage(error, "Shared, but the share count could not be updated."));
    }
  }

  async function handleShareAction(target) {
    if (isSubmittingShare) {
      return;
    }

    setIsSubmittingShare(true);
    setShareFeedback("");
    setShareError("");

    try {
      if (target.id === "copy") {
        await copyTextToClipboard(articleUrl);
        await recordShare(target.id);
        setShareFeedback("Link copied.");
      } else if (target.id === "native") {
        await navigator.share({
          title: articleTitle,
          text: articleTitle,
          url: articleUrl,
        });
        await recordShare(target.id);
        setShareFeedback("Share opened on your device.");
      } else if (target.id === "email") {
        window.location.href = target.href;
        await recordShare(target.id);
        setShareFeedback(`Opening ${target.label}.`);
      } else {
        window.open(target.href, "_blank", "noopener,noreferrer");
        await recordShare(target.id);
        setShareFeedback(`Opening ${target.label}.`);
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        setShareFeedback("");
        setShareMenuOpen(false);
        setIsSubmittingShare(false);
        return;
      }

      setShareError(getApiErrorMessage(error, "We could not open that share target."));
    } finally {
      setShareMenuOpen(false);
      setIsSubmittingShare(false);
    }
  }

  const likeLabel = liked ? "Unlike article" : "Like article";
  const LikeIcon = liked ? FaHeart : FiHeart;
  const size = compact ? 14 : 16;

  return (
    <div className="engagement-stack">
      <div className={`engagement-bar ${compact ? "engagement-bar--compact" : ""}`.trim()}>
        <button
          type="button"
          className={`engagement-button ${liked ? "is-active" : ""}`.trim()}
          onClick={handleLike}
          aria-pressed={liked}
          aria-label={likeLabel}
          title={likeLabel}
          disabled={isSubmittingLike || !articleId}
        >
          <LikeIcon size={size} />
          <span>{formatCompactCount(displayLikesCount, "likes")}</span>
        </button>

        {commentHref ? (
          <Link
            to={commentHref}
            className="engagement-link"
            aria-label="Open comments"
            title="Open comments"
          >
            <FiMessageCircle size={size} />
            <span>{formatCompactCount(commentsCount, "comments")}</span>
          </Link>
        ) : (
          <button
            type="button"
            className="engagement-button"
            onClick={onCommentClick}
            aria-label="Write a comment"
            title="Write a comment"
          >
            <FiMessageCircle size={size} />
            <span>{formatCompactCount(commentsCount, "comments")}</span>
          </button>
        )}

        <div className="engagement-share" ref={shareMenuRef}>
          <button
            type="button"
            className="engagement-button"
            onClick={() => setShareMenuOpen((currentValue) => !currentValue)}
            aria-expanded={shareMenuOpen}
            aria-haspopup="menu"
            aria-label="Share article"
            title="Share article"
            disabled={!articleId}
          >
            <FiShare2 size={size} />
            <span>{formatCompactCount(displaySharesCount, "shares")}</span>
          </button>

          {shareMenuOpen ? (
            <div className="engagement-share__menu" role="menu" aria-label="Share article to">
              <p className="engagement-share__title mb-0">Share this article</p>

              {shareTargets.map((target) => {
                const Icon = target.icon;

                return (
                  <button
                    key={target.id}
                    type="button"
                    className="engagement-share__option"
                    onClick={() => handleShareAction(target)}
                    disabled={isSubmittingShare}
                  >
                    <Icon size={15} />
                    <span>{target.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {likeError ? (
        <p className="engagement-feedback engagement-feedback--error mb-0">{likeError}</p>
      ) : null}

      {shareError ? (
        <p className="engagement-feedback engagement-feedback--error mb-0">{shareError}</p>
      ) : null}

      {!shareError && shareFeedback ? (
        <p className="engagement-feedback mb-0">
          <FiCheck size={14} />
          <span>{shareFeedback}</span>
        </p>
      ) : null}
    </div>
  );
}

export default EngagementBar;
