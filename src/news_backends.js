import API from "./axios";

export const NEWS_ENDPOINTS = {
  categories: "news/categories/",
  sportsSubcategories: "news/categories/sports/subcategories/",
  articles: "news/articles/",
  videos: "news/videos/",
  groupedVideos: "news/videos/grouped/",
  allNews: "news/all/",
  comments: "news/comments/",
  shares: "news/shares/",
  likes: "news/likes/",
};

function buildListParams(options = {}) {
  const params = {};

  // Support category filtering for articles
  if (options.category || options.categorySlug) {
    params.category = options.category || options.categorySlug;
  }
  if (options.subcategory || options.subcategorySlug) {
    params.subcategory = options.subcategory || options.subcategorySlug;
  }

  if (options.group) params.group = options.group;
  if (options.page) params.page = options.page;
  if (options.pageSize || options.limit) {
    const size = Math.min(Math.max(Number(options.pageSize || options.limit) || 10, 1), 25);
    params.page_size = size;
  }
  if (options.search) params.search = options.search;

  return params;
}

async function requestFirstAvailable(candidates, payload = {}) {
  let lastError = null;

  for (const candidate of candidates) {
    try {
      const response = await API.request({
        method: candidate.method ?? "get",
        url: typeof candidate.url === "function" ? candidate.url(payload) : candidate.url,
        params: candidate.buildParams?.(payload),
        data: candidate.buildData?.(payload),
        skipAuth: Boolean(candidate.skipAuth),
      });

      return response.data;
    } catch (error) {
      lastError = error;
      const retryStatuses = candidate.retryStatuses ?? [404, 405];

      if (!retryStatuses.includes(error?.response?.status)) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error("No matching news endpoint is available.");
}

// ==================== FETCH FUNCTIONS ====================

export const fetchCategories = async (options = {}) => {
  const response = await API.get(NEWS_ENDPOINTS.categories, {
    params: buildListParams(options),
    skipAuth: true,
  });
  return response.data;
};

export const fetchSportsSubcategories = async () => {
  const response = await API.get(NEWS_ENDPOINTS.sportsSubcategories, {
    skipAuth: true,
  });
  return response.data;
};

export const fetchArticles = async (options = {}) => {
  const response = await API.get(NEWS_ENDPOINTS.articles, {
    params: buildListParams(options),
    skipAuth: true,
  });
  return response.data;
};

export const fetchArticleById = async (articleId) => {
  const response = await API.get(`${NEWS_ENDPOINTS.articles}${articleId}/`, {
    skipAuth: true,
  });
  return response.data;
};

export const fetchArticleComments = async (articleId) =>
  requestFirstAvailable(
    [
      {
        url: ({ articleId: currentArticleId }) =>
          `${NEWS_ENDPOINTS.articles}${currentArticleId}/comments/`,
        skipAuth: true,
        retryStatuses: [400, 404, 405, 422],
      },
      {
        url: NEWS_ENDPOINTS.comments,
        buildParams: ({ articleId: currentArticleId }) => ({ article: currentArticleId }),
        skipAuth: true,
        retryStatuses: [400, 404, 405, 422],
      },
      {
        url: NEWS_ENDPOINTS.comments,
        buildParams: ({ articleId: currentArticleId }) => ({ article_id: currentArticleId }),
        skipAuth: true,
        retryStatuses: [400, 404, 405, 422],
      },
      {
        url: "comments/",
        buildParams: ({ articleId: currentArticleId }) => ({ article: currentArticleId }),
        skipAuth: true,
        retryStatuses: [400, 404, 405, 422],
      },
    ],
    { articleId },
  );

const COMMENT_TEXT_FIELDS = ["content", "comment", "body", "text", "message"];
const COMMENT_ARTICLE_FIELDS = ["article", "article_id"];
const COMMENT_RETRY_STATUSES = [400, 404, 405, 422];

function buildCommentData(articleField, textField) {
  return ({ articleId: currentArticleId, commentText: currentCommentText }) => ({
    [articleField]: currentArticleId,
    [textField]: currentCommentText,
  });
}

export const createArticleComment = async (articleId, commentText) =>
  requestFirstAvailable(
    [
      ...COMMENT_TEXT_FIELDS.map((textField) => ({
        method: "post",
        url: ({ articleId: currentArticleId }) =>
          `${NEWS_ENDPOINTS.articles}${currentArticleId}/comments/`,
        buildData: ({ commentText: currentCommentText }) => ({
          [textField]: currentCommentText,
        }),
        retryStatuses: COMMENT_RETRY_STATUSES,
      })),
      ...COMMENT_ARTICLE_FIELDS.flatMap((articleField) =>
        COMMENT_TEXT_FIELDS.map((textField) => ({
          method: "post",
          url: NEWS_ENDPOINTS.comments,
          buildData: buildCommentData(articleField, textField),
          retryStatuses: COMMENT_RETRY_STATUSES,
        })),
      ),
      ...COMMENT_ARTICLE_FIELDS.flatMap((articleField) =>
        COMMENT_TEXT_FIELDS.map((textField) => ({
          method: "post",
          url: "comments/",
          buildData: buildCommentData(articleField, textField),
          retryStatuses: COMMENT_RETRY_STATUSES,
        })),
      ),
    ],
    { articleId, commentText },
  );

export const likeArticle = async (articleId, shouldLike = true) =>
  requestFirstAvailable(
    shouldLike
      ? [
        {
          method: "post",
          url: ({ articleId: currentArticleId }) =>
            `${NEWS_ENDPOINTS.articles}${currentArticleId}/like/`,
        },
        {
          method: "post",
          url: ({ articleId: currentArticleId }) =>
            `${NEWS_ENDPOINTS.articles}${currentArticleId}/likes/`,
        },
        {
          method: "post",
          url: ({ articleId: currentArticleId }) =>
            `${NEWS_ENDPOINTS.articles}${currentArticleId}/toggle-like/`,
        },
        {
          method: "post",
          url: NEWS_ENDPOINTS.likes,
          buildData: ({ articleId: currentArticleId }) => ({ article: currentArticleId }),
        },
        {
          method: "post",
          url: "likes/",
          buildData: ({ articleId: currentArticleId }) => ({ article: currentArticleId }),
        },
      ]
      : [
        {
          method: "post",
          url: ({ articleId: currentArticleId }) =>
            `${NEWS_ENDPOINTS.articles}${currentArticleId}/unlike/`,
        },
        {
          method: "delete",
          url: ({ articleId: currentArticleId }) =>
            `${NEWS_ENDPOINTS.articles}${currentArticleId}/like/`,
        },
        {
          method: "delete",
          url: ({ articleId: currentArticleId }) =>
            `${NEWS_ENDPOINTS.articles}${currentArticleId}/likes/`,
        },
        {
          method: "post",
          url: ({ articleId: currentArticleId }) =>
            `${NEWS_ENDPOINTS.articles}${currentArticleId}/toggle-like/`,
        },
        {
          method: "delete",
          url: NEWS_ENDPOINTS.likes,
          buildData: ({ articleId: currentArticleId }) => ({ article: currentArticleId }),
        },
        {
          method: "delete",
          url: "likes/",
          buildData: ({ articleId: currentArticleId }) => ({ article: currentArticleId }),
        },
      ],
    { articleId },
  );

export const shareArticle = async (articleId, sharePayload = {}) =>
  requestFirstAvailable(
    [
      {
        method: "post",
        url: ({ articleId: currentArticleId }) =>
          `${NEWS_ENDPOINTS.articles}${currentArticleId}/share/`,
        buildData: ({ sharePayload: currentSharePayload }) => currentSharePayload,
        retryStatuses: [400, 404, 405, 422],
      },
      {
        method: "post",
        url: ({ articleId: currentArticleId }) =>
          `${NEWS_ENDPOINTS.articles}${currentArticleId}/share/`,
        buildData: () => ({}),
        retryStatuses: [400, 404, 405, 422],
      },
      {
        method: "post",
        url: ({ articleId: currentArticleId }) =>
          `${NEWS_ENDPOINTS.articles}${currentArticleId}/shares/`,
        buildData: ({ sharePayload: currentSharePayload }) => currentSharePayload,
        retryStatuses: [400, 404, 405, 422],
      },
      {
        method: "post",
        url: ({ articleId: currentArticleId }) =>
          `${NEWS_ENDPOINTS.articles}${currentArticleId}/shares/`,
        buildData: () => ({}),
        retryStatuses: [400, 404, 405, 422],
      },
      {
        method: "post",
        url: NEWS_ENDPOINTS.shares,
        buildData: ({ articleId: currentArticleId, sharePayload: currentSharePayload }) => ({
          article: currentArticleId,
          ...currentSharePayload,
        }),
        retryStatuses: [400, 404, 405, 422],
      },
      {
        method: "post",
        url: "shares/",
        buildData: ({ articleId: currentArticleId, sharePayload: currentSharePayload }) => ({
          article: currentArticleId,
          ...currentSharePayload,
        }),
        retryStatuses: [400, 404, 405, 422],
      },
    ],
    { articleId, sharePayload },
  );

export const fetchVideos = async (options = {}) => {
  const response = await API.get(NEWS_ENDPOINTS.videos, {
    params: buildListParams(options),
    skipAuth: true,
  });
  return response.data;
};

export const fetchGroupedVideos = async (options = {}) => {
  const response = await API.get(NEWS_ENDPOINTS.groupedVideos, {
    params: buildListParams(options),
    skipAuth: true,
  });
  return response.data;
};

export const fetchVideoBySlug = async (videoSlug) => {
  const response = await API.get(`${NEWS_ENDPOINTS.videos}${videoSlug}/`, {
    skipAuth: true,
  });
  return response.data;
};

export const fetchAllNews = async () => {
  const response = await API.get(NEWS_ENDPOINTS.allNews, {
    skipAuth: true,
  });
  return response.data;
};
