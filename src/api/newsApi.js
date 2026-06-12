import {
  createArticleComment,
  fetchArticleById,
  fetchArticleComments,
  fetchArticles,
  fetchCategories,
  likeArticle,
  shareArticle,
  fetchSportsSubcategories,
  fetchVideoBySlug,
  fetchVideos,
} from "../news_backends";
import { resolveBackendUrl } from "./backendConfig";

const SPORTS_CATEGORY_SLUGS = new Set([
  "sports", "general", "football", "basketball", "tennis", "boxing", "formula-1", "golf", "olympics"
]);

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTitleCase(value) {
  return String(value ?? "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// ==================== HELPERS ====================
function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toCount(value) {
  if (Array.isArray(value)) return value.length;
  return toNumber(value);
}

function toParagraphs(value) {
  if (Array.isArray(value)) return value.map(p => String(p ?? "").trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  return [];
}

function pickFirstString(...values) {
  return values.find(v => typeof v === "string" && v.trim().length > 0) ?? "";
}

function pickFirstBoolean(...values) {
  return values.find(v => typeof v === "boolean");
}

function buildExcerpt(record) {
  const explicit = pickFirstString(record.excerpt, record.summary, record.description, record.snippet, record.deck);
  if (explicit) return explicit;
  const paras = toParagraphs(record.body ?? record.content ?? record.article_body ?? record.text);
  return paras[0] ?? "";
}

function normalizeEngagementCounts(record, fallback = {}) {
  if (!record || typeof record !== "object") {
    return {
      likes_count: toCount(fallback.likes_count),
      comments_count: toCount(fallback.comments_count),
      shares_count: toCount(fallback.shares_count),
    };
  }

  return {
    likes_count: toCount(
      record.likes_count
        ?? record.like_count
        ?? record.likes
        ?? record.total_likes
        ?? record.engagement?.likes_count
        ?? record.engagement?.likes
        ?? fallback.likes_count,
    ),
    comments_count: toCount(
      record.comments_count
        ?? record.comment_count
        ?? record.comments
        ?? record.total_comments
        ?? record.engagement?.comments_count
        ?? record.engagement?.comments
        ?? fallback.comments_count,
    ),
    shares_count: toCount(
      record.shares_count
        ?? record.share_count
        ?? record.shares
        ?? record.total_shares
        ?? record.engagement?.shares_count
        ?? record.engagement?.shares
        ?? fallback.shares_count,
    ),
  };
}

function normalizeComment(record) {
  if (!record || typeof record !== "object") return null;

  const author = record.user && typeof record.user === "object"
    ? pickFirstString(
      record.user.display_name,
      record.user.full_name,
      record.user.username,
      record.user.name,
      record.user.email,
    )
    : pickFirstString(
      record.author,
      record.author_name,
      record.user_name,
      record.username,
      record.name,
      record.email,
    );

  const body = pickFirstString(
    record.body,
    record.content,
    record.comment,
    record.text,
    record.message,
  );

  if (!body) return null;

  return {
    id: record.id ?? record.pk ?? `${author || "reader"}-${body.slice(0, 24)}-${pickFirstString(record.created_at, record.timestamp)}`,
    author: author || "Reader",
    body,
    created_at: pickFirstString(
      record.created_at,
      record.createdAt,
      record.updated_at,
      record.timestamp,
      record.published_at,
    ),
  };
}

function normalizeCommentsCollection(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeComment).filter(Boolean);
  }

  if (Array.isArray(value?.results)) {
    return value.results.map(normalizeComment).filter(Boolean);
  }

  if (Array.isArray(value?.data)) {
    return value.data.map(normalizeComment).filter(Boolean);
  }

  return [];
}

function normalizeEngagementAction(payload, fallbackCounts = {}) {
  const source = payload?.article && typeof payload.article === "object"
    ? payload.article
    : payload?.data && typeof payload.data === "object"
      ? payload.data
      : payload;

  return {
    ...normalizeEngagementCounts(source, fallbackCounts),
    liked: pickFirstBoolean(
      payload?.liked,
      payload?.is_liked,
      source?.liked,
      source?.is_liked,
    ),
    comment: normalizeComment(
      payload?.comment
        ?? payload?.data?.comment
        ?? payload?.result?.comment
        ?? (source && !Array.isArray(source) ? source : null),
    ),
  };
}

// ==================== NORMALIZATION ====================
function normalizeCategory(record) {
  let raw = "";

  if (typeof record.category === "string") raw = record.category;
  else if (record.category && typeof record.category === "object") {
    raw = record.category.name || record.category.slug || record.category.title || "";
  } else {
    raw = record.category_name || record.category_slug || record.name || record.slug || record.title || record.label || record.section_name || record.section || "";
  }

  const slugified = slugify(raw.toLowerCase());

  const categoryMap = {
    "news": "world",
    "international": "world",
    "sport": "sports",
    "sports": "sports",
    "tech": "technology",
    "technology": "technology",
    "entertain": "entertainment",
    "entertainment": "entertainment",
    "movie": "entertainment",
    "music": "entertainment",
    "celebrity": "entertainment",
    "showbiz": "entertainment",
    "fun": "entertainment",
  };

  const finalSlug = categoryMap[slugified] || slugified || "uncategorized";

  return {
    name: raw || "Uncategorized",
    slug: finalSlug,
  };
}


function normalizeArticle(record) {
  if (!record || typeof record !== "object") return null;
  const counts = normalizeEngagementCounts(record);

  return {
    id: record.id ?? record.pk ?? null,
    title: pickFirstString(record.title, record.headline, "Untitled"),
    excerpt: buildExcerpt(record),
    body: toParagraphs(record.body ?? record.content ?? record.article_body ?? record.text),
    image: pickFirstString(record.image, record.image_url, record.featured_image, record.thumbnail, record.cover_image),
    image_alt: pickFirstString(record.image_alt, record.alt_text, record.title),
    category: normalizeCategory(record),
    source: pickFirstString(record.source, record.source_name, "MyNews"),
    author: pickFirstString(record.author, record.author_name, "Editorial Desk"),
    published_at: pickFirstString(record.published_at, record.published_date, record.created_at),
    likes_count: counts.likes_count,
    comments_count: counts.comments_count,
    shares_count: counts.shares_count,
    comments: normalizeCommentsCollection(
      record.comments
        ?? record.comment_list
        ?? record.comments_list
        ?? record.latest_comments,
    ),
  };
}

// function normalizeVideo(record) {
//   if (!record || typeof record !== "object") return null;
//   return {
//     slug: pickFirstString(record.slug, record.id ? String(record.id) : ""),
//     title: pickFirstString(record.title, record.name, "Untitled video"),
//     thumbnail: pickFirstString(record.thumbnail, record.image, record.image_url),
//     description: pickFirstString(record.description, record.summary, record.excerpt),
//     duration: pickFirstString(record.duration),
//     category: normalizeCategory(record),
//     published_at: pickFirstString(record.published_at, record.published_date),
//   };
// }

function normalizeVideo(record) {
  if (!record || typeof record !== "object") return null;
  const category = normalizeCategory(record);
  const rawSubcategory = typeof record.subcategory === "string"
    ? record.subcategory
    : record.subcategory && typeof record.subcategory === "object"
      ? pickFirstString(
        record.subcategory.name,
        record.subcategory.slug,
        record.subcategory.title,
      )
      : pickFirstString(
        record.subcategory_name,
        record.subcategory_slug,
        record.sport_name,
        record.sport_slug,
      );
  const rawCategorySlug = slugify(
    pickFirstString(
      record.category_slug,
      record.category?.slug,
      record.category_name,
      category.slug,
      category.name,
    )
  );
  const subcategorySlug = slugify(
    pickFirstString(
      record.subcategory_slug,
      record.subcategory?.slug,
      record.sport_slug,
      rawSubcategory,
    )
  );
  const sportsUnitSlug =
    SPORTS_CATEGORY_SLUGS.has(rawCategorySlug) && !["sports", "general"].includes(rawCategorySlug)
      ? rawCategorySlug
      : SPORTS_CATEGORY_SLUGS.has(subcategorySlug) && !["sports", "general"].includes(subcategorySlug)
        ? subcategorySlug
        : "";
  const thumbnailUrl = pickFirstString(
    record.thumbnail_url,
    record.thumbnail,
    record.image,
    record.image_url
  );
  const publishedDate = pickFirstString(
    record.published_at,
    record.published_date
  );

  return {
    slug: pickFirstString(
      record.slug,
      record.id ? String(record.id) : ""
    ),

    title: pickFirstString(
      record.title,
      record.name,
      "Untitled video"
    ),

    thumbnail: thumbnailUrl,
    thumbnail_url: thumbnailUrl,

    description: pickFirstString(
      record.description,
      record.summary,
      record.excerpt
    ),

    duration: pickFirstString(record.duration),

    category,

    category_name: pickFirstString(
      record.category_name,
      category.name
    ),
    sports_unit_name: sportsUnitSlug ? toTitleCase(sportsUnitSlug) : "",
    sports_unit_slug: sportsUnitSlug,

    published_at: publishedDate,
    published_date: publishedDate,

    youtube_video_id: pickFirstString(
      record.youtube_video_id
    ),

    video_url: pickFirstString(
      record.video_url
    ),

    embed_url: pickFirstString(
      record.embed_url
    ),

    source_url: pickFirstString(
      record.source_url
    ),

    author_name: pickFirstString(
      record.author_name
    ),

    source: pickFirstString(
      record.source
    ),
  };
}

function normalizeCategoryRecord(record) {
  if (!record || typeof record !== "object") return null;
  const cat = normalizeCategory(record);
  return {
    id: record.id ?? record.pk ?? null,
    name: cat.name,
    slug: cat.slug,
    group: pickFirstString(record.group) || (SPORTS_CATEGORY_SLUGS.has(cat.slug) ? "sports" : "primary"),
  };
}

function normalizeSportsSubcategoryRecord(record) {
  if (typeof record === "string") {
    const slug = slugify(record);
    if (!slug) return null;

    return {
      name: toTitleCase(slug),
      slug,
    };
  }

  if (!record || typeof record !== "object") return null;

  const rawName = pickFirstString(
    record.name,
    record.title,
    record.label,
    record.slug,
    record.subcategory,
  );
  const slug = slugify(record.slug ?? record.subcategory ?? rawName);
  if (!slug) return null;

  return {
    name: rawName || toTitleCase(slug),
    slug,
  };
}

function normalizeListPayload(payload, normalizer) {
  const items = toItemsArray(payload).map(normalizer).filter(Boolean);

  if (Array.isArray(payload)) return items;
  if (payload && typeof payload === "object") return { ...payload, results: items };
  return items;
}

function toItemsArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.articles)) return payload.articles;
  if (Array.isArray(payload?.news)) return payload.news;
  if (Array.isArray(payload?.videos)) return payload.videos;
  return [];
}

function takeLimitedItems(items, limit) {
  const l = Number(limit);
  return (Number.isFinite(l) && l > 0) ? items.slice(0, l) : items;
}

const MAX_PAGINATED_PAGES = 50;

async function fetchAllPaginatedPages(fetcher, options = {}) {
  const pageSize = Math.max(options.pageSize || options.limit || 100, 100);
  const firstPage = options.page ?? 1;
  const firstPayload = await fetcher({
    ...options,
    page: firstPage,
    pageSize,
  });

  if (Array.isArray(firstPayload) || !firstPayload || typeof firstPayload !== "object") {
    return firstPayload;
  }

  const allItems = [...toItemsArray(firstPayload)];
  const totalCount = toNumber(firstPayload.count);
  let nextPage = firstPage + 1;
  let hasNextPage = Boolean(firstPayload.next) || (totalCount > allItems.length);

  while (hasNextPage && nextPage <= MAX_PAGINATED_PAGES) {
    const payload = await fetcher({
      ...options,
      page: nextPage,
      pageSize,
    });
    const pageItems = toItemsArray(payload);

    if (pageItems.length === 0) {
      break;
    }

    allItems.push(...pageItems);
    hasNextPage = Boolean(payload?.next) || (totalCount > allItems.length);
    nextPage += 1;
  }

  return {
    ...firstPayload,
    next: null,
    results: allItems,
  };
}

// ==================== MAIN FIX ====================
function getExpandedArticleOptions(options = {}) {
  const expanded = { ...options };

  if (options.categorySlug) {
    expanded.category = options.categorySlug;
  }
  if (options.subcategorySlug) {
    expanded.subcategory = options.subcategorySlug;
  }
  if (options.page || options.pageSize || options.limit) {
    expanded.page = options.page ?? 1;
    expanded.pageSize = Math.max(options.pageSize || options.limit || 20, 10);
  }

  return expanded;
}

function getExpandedVideoOptions(options = {}) {
  const expanded = { ...options };
  if (options.categorySlug) expanded.category = options.categorySlug;
  if (options.subcategorySlug) expanded.subcategory = options.subcategorySlug;
  return expanded;
}

// ==================== API FUNCTIONS ====================
export async function getArticles(options = {}) {
  const expandedOptions = getExpandedArticleOptions(options);
  const payload = options.allPages
    ? await fetchAllPaginatedPages(fetchArticles, expandedOptions)
    : await fetchArticles(expandedOptions);
  return normalizeListPayload(payload, normalizeArticle);
}

export async function getArticlesByCategory(categorySlug, options = {}) {
  return getArticles({ ...options, categorySlug });
}

export async function getLatestArticles(options = {}) {
  const expandedOptions = getExpandedArticleOptions(options);
  const payload = options.allPages
    ? await fetchAllPaginatedPages(fetchArticles, expandedOptions)
    : await fetchArticles(expandedOptions);
  let articles = toItemsArray(normalizeListPayload(payload, normalizeArticle));

  if (options.categorySlug) {
    const target = slugify(options.categorySlug);
    articles = articles.filter(a => slugify(a.category?.slug) === target);
  }

  const sortedArticles = [...articles].sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  return options.allPages ? sortedArticles : takeLimitedItems(sortedArticles, options.limit);
}

export async function getTrendingArticles(options = {}) {
  const expandedOptions = getExpandedArticleOptions(options);
  const payload = options.allPages
    ? await fetchAllPaginatedPages(fetchArticles, expandedOptions)
    : await fetchArticles(expandedOptions);
  let articles = toItemsArray(normalizeListPayload(payload, normalizeArticle));

  if (options.categorySlug) {
    const target = slugify(options.categorySlug);
    articles = articles.filter(a => slugify(a.category?.slug) === target);
  }

  const sortedArticles = [...articles].sort((a, b) => (b.likes_count||0) - (a.likes_count||0));
  return options.allPages ? sortedArticles : takeLimitedItems(sortedArticles, options.limit);
}

export async function getCategories(options = {}) {
  const payload = await fetchCategories(options);
  return toItemsArray(normalizeListPayload(payload, normalizeCategoryRecord));
}

export async function getSportsSubcategories() {
  const payload = await fetchSportsSubcategories();
  return toItemsArray(payload).map(normalizeSportsSubcategoryRecord).filter(Boolean);
}

export async function getVideos(options = {}) {
  const expandedOptions = getExpandedVideoOptions(options);
  const payload = options.allPages
    ? await fetchAllPaginatedPages(fetchVideos, expandedOptions)
    : await fetchVideos(expandedOptions);
  return normalizeListPayload(payload, normalizeVideo);
}

export async function getVideosByCategory(categorySlug, options = {}) {
  return getVideos({ ...options, categorySlug });
}

// Keep the rest of your functions unchanged (getArticleById, getVideoBySlug, etc.)
export async function getArticleById(articleId) {
  try {
    const payload = await fetchArticleById(articleId);
    return normalizeArticle(payload);
  } catch (e) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

export async function getArticleComments(articleId) {
  const payload = await fetchArticleComments(articleId);
  return normalizeCommentsCollection(payload);
}

export async function postArticleComment(articleId, commentText, fallbackCounts = {}) {
  const payload = await createArticleComment(articleId, commentText);
  return normalizeEngagementAction(payload, fallbackCounts);
}

export async function sendArticleLike(articleId, shouldLike = true, fallbackCounts = {}) {
  const payload = await likeArticle(articleId, shouldLike);
  return normalizeEngagementAction(payload, fallbackCounts);
}

export async function registerArticleShare(articleId, sharePayload = {}, fallbackCounts = {}) {
  const payload = await shareArticle(articleId, sharePayload);
  return normalizeEngagementAction(payload, fallbackCounts);
}

export async function getVideoBySlug(videoSlug) {
  try {
    const payload = await fetchVideoBySlug(videoSlug);
    return normalizeVideo(payload);
  } catch (e) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

export function resolveMediaUrl(path) {
  return resolveBackendUrl(path);
}

export async function getGroupedVideos(options = {}) {
  const payload = await getVideos(options);
  const videos = toItemsArray(payload);

  return videos.reduce((groups, video) => {
    const categorySlug = slugify(
      pickFirstString(
        video.category?.slug,
        video.category_name,
        video.category?.name,
      )
    );
    const groupKey = SPORTS_CATEGORY_SLUGS.has(categorySlug) || categorySlug === "world"
      ? "sports"
      : categorySlug || "uncategorized";
    const categoryName = pickFirstString(
      video.category_name,
      video.category?.name,
      toTitleCase(groupKey),
      "Uncategorized"
    );
    const groupedVideo = {
      ...video,
      category_name: groupKey === "sports" ? "Sports" : categoryName,
    };
    const nextGroups = {
      ...groups,
      [groupKey]: [...(groups[groupKey] ?? []), groupedVideo],
    };

    if (groupKey !== "sports" || !video.sports_unit_slug) {
      return nextGroups;
    }

    return {
      ...nextGroups,
      [video.sports_unit_slug]: [
        ...(nextGroups[video.sports_unit_slug] ?? []),
        {
          ...groupedVideo,
          category_name: video.sports_unit_name || toTitleCase(video.sports_unit_slug),
        },
      ],
    };
  }, {});
}
