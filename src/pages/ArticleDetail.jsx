import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import EngagementBar from "../components/EngagementBar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Loader from "../components/Loader";
import { hasStoredAuthToken } from "../auth";
import {
  getArticleById,
  getArticleComments,
  postArticleComment,
  resolveMediaUrl,
} from "../api/newsApi";
import { getCategoryPath } from "../config/pageConfig";
import { getApiErrorMessage } from "../utils/apiErrors";
import { formatDateTime, formatPublishedDate } from "../utils/formatters";

function ArticleDetail() {
  const { articleId } = useParams();
  const location = useLocation();
  const commentInputRef = useRef(null);
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const isAuthenticated = hasStoredAuthToken();

  useEffect(() => {
    let cancelled = false;

    async function loadArticle() {
      setLoading(true);
      setLoadError("");
      setComments([]);
      setCommentsError("");
      setCommentDraft("");
      setSubmitError("");
      setSubmitSuccess("");

      try {
        const result = await getArticleById(articleId);

        if (cancelled) {
          return;
        }

        setArticle(result);
        setComments(result?.comments ?? []);

        if (!result) {
          setCommentsLoading(false);
          setLoading(false);
          return;
        }

        setCommentsLoading(true);
        setLoading(false);

        try {
          const latestComments = await getArticleComments(articleId);

          if (cancelled) {
            return;
          }

          setComments(latestComments);
          setArticle((currentArticle) =>
            currentArticle
              ? {
                ...currentArticle,
                comments_count: Math.max(
                  currentArticle.comments_count ?? 0,
                  latestComments.length,
                ),
              }
              : currentArticle,
          );
        } catch (error) {
          if (!cancelled && !(result.comments?.length > 0)) {
            setCommentsError(
              getApiErrorMessage(error, "Comments are not available right now."),
            );
          }
        } finally {
          if (!cancelled) {
            setCommentsLoading(false);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setArticle(null);
          setComments([]);
          setLoadError(
            getApiErrorMessage(error, "We could not load this article right now."),
          );
          setLoading(false);
          setCommentsLoading(false);
        }
      }
    }

    loadArticle();

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  useEffect(() => {
    if (location.hash !== "#comments" || !article) {
      return;
    }

    focusCommentComposer();
  }, [article, location.hash]);

  function focusCommentComposer() {
    const commentsSection = document.getElementById("comments");
    commentsSection?.scrollIntoView({ behavior: "smooth", block: "start" });

    window.setTimeout(() => {
      commentInputRef.current?.focus();
    }, 180);
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();

    const trimmedComment = commentDraft.trim();
    if (!trimmedComment || !article) {
      setSubmitError("Write a comment before posting.");
      setSubmitSuccess("");
      return;
    }

    setIsSubmittingComment(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const response = await postArticleComment(article.id, trimmedComment, {
        likes_count: article.likes_count,
        comments_count: article.comments_count,
        shares_count: article.shares_count,
      });

      let nextComments = comments;

      if (response.comment) {
        nextComments = [
          response.comment,
          ...comments.filter((comment) => comment.id !== response.comment.id),
        ];
      } else {
        nextComments = await getArticleComments(article.id);
      }

      setComments(nextComments);
      setCommentDraft("");
      setSubmitSuccess("Your comment has been posted.");
      setArticle((currentArticle) =>
        currentArticle
          ? {
            ...currentArticle,
            comments_count: response.comments_count > 0
              ? response.comments_count
              : Math.max(currentArticle.comments_count + 1, nextComments.length),
          }
          : currentArticle,
      );
    } catch (error) {
      const fallbackMessage = error?.response?.status === 401
        ? "Please log in before posting a comment."
        : "We could not post your comment right now.";

      setSubmitError(getApiErrorMessage(error, fallbackMessage));
    } finally {
      setIsSubmittingComment(false);
    }
  }

  const displayedCommentsCount = Math.max(
    article?.comments_count ?? 0,
    comments.length,
  );

  return (
    <>
      <Header searchTarget="/" />

      <main className="container py-4">
        {loading ? <Loader label="Loading article detail..." /> : null}

        {!loading && loadError ? (
          <div className="alert alert-danger rounded-4 mb-0">
            {loadError}
          </div>
        ) : null}

        {!loading && !loadError && !article ? (
          <div className="alert alert-warning rounded-4 mb-0">
            We could not find that article.
          </div>
        ) : null}

        {!loading && article ? (
          <article className="bg-white border rounded-4 shadow-sm overflow-hidden">
            <img
              src={resolveMediaUrl(article.image)}
              alt={article.image_alt || article.title}
              className="detail-media w-100"
            />

            <div className="p-4 p-lg-5">
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Link
                  to={getCategoryPath(article.category.slug)}
                  className="badge text-bg-light border text-decoration-none text-secondary"
                >
                  {article.category.name}
                </Link>
                <span className="badge text-bg-dark">
                  {formatPublishedDate(article.published_at)}
                </span>
              </div>

              <h1 className="display-6 fw-semibold mb-3">{article.title}</h1>

              <p className="lead text-secondary">{article.excerpt}</p>

              <div className="d-flex flex-wrap gap-3 small text-secondary mb-4">
                <span>
                  <strong>{article.author}</strong> for {article.source}
                </span>
              </div>

              <div className="mb-4">
                <EngagementBar
                  articleId={article.id}
                  articleTitle={article.title}
                  articlePath={`/articles/${article.id}`}
                  likesCount={article.likes_count}
                  commentsCount={displayedCommentsCount}
                  sharesCount={article.shares_count}
                  onCommentClick={focusCommentComposer}
                />
              </div>

              <div className="d-flex flex-column gap-3">
                {article.body.map((paragraph, index) => (
                  <p key={`${index}-${paragraph.slice(0, 32)}`} className="mb-0 text-dark">
                    {paragraph}
                  </p>
                ))}
              </div>

              <section id="comments" className="article-comments mt-5">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                  <div>
                    <h2 className="h4 fw-semibold mb-1">Comments</h2>
                    <p className="text-secondary mb-0">
                      {displayedCommentsCount} reader comments
                    </p>
                  </div>

                  {!isAuthenticated ? (
                    <p className="small text-secondary mb-0">
                      <Link to="/login">Login</Link> or <Link to="/register">register</Link> before posting.
                    </p>
                  ) : null}
                </div>

                <form className="article-comments__form mt-4" onSubmit={handleCommentSubmit}>
                  <label htmlFor="article-comment" className="form-label fw-semibold">
                    Add your comment
                  </label>
                  <textarea
                    id="article-comment"
                    ref={commentInputRef}
                    rows="4"
                    className="form-control article-comments__textarea"
                    placeholder="Share your thoughts on this story"
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                  />

                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-3">
                    <p className="small text-secondary mb-0">
                      Keep it respectful and on topic.
                    </p>

                    <button
                      type="submit"
                      className="btn btn-danger rounded-pill px-4"
                      disabled={isSubmittingComment}
                    >
                      {isSubmittingComment ? "Posting..." : "Post comment"}
                    </button>
                  </div>
                </form>

                {submitError ? (
                  <div className="alert alert-danger rounded-4 mt-3 mb-0">
                    {submitError}
                  </div>
                ) : null}

                {submitSuccess ? (
                  <div className="alert alert-success rounded-4 mt-3 mb-0">
                    {submitSuccess}
                  </div>
                ) : null}

                {commentsLoading ? (
                  <div className="mt-4">
                    <Loader label="Loading comments..." />
                  </div>
                ) : null}

                {!commentsLoading && commentsError ? (
                  <div className="alert alert-warning rounded-4 mt-4 mb-0">
                    {commentsError}
                  </div>
                ) : null}

                {!commentsLoading && !commentsError && comments.length === 0 ? (
                  <div className="article-comments__empty mt-4">
                    No comments yet. Be the first to respond.
                  </div>
                ) : null}

                {comments.length > 0 ? (
                  <div className="article-comments__list mt-4">
                    {comments.map((comment, index) => (
                      <article
                        key={comment.id ?? `${comment.author}-${index}`}
                        className="article-comments__item"
                      >
                        <div className="d-flex flex-wrap justify-content-between gap-3 mb-2">
                          <div>
                            <h3 className="article-comments__author mb-1">
                              {comment.author}
                            </h3>
                            <p className="article-comments__meta mb-0">
                              {formatDateTime(comment.created_at)}
                            </p>
                          </div>
                        </div>

                        <p className="article-comments__body mb-0">
                          {comment.body}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : null}
              </section>
            </div>
          </article>
        ) : null}
      </main>

      <Footer />
    </>
  );
}

export default ArticleDetail;
