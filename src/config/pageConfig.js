export const primaryNavItems = [
  { label: "Home", path: "/" },
  { label: "Sports", path: "/sports" },
  { label: "Crime", path: "/crime" },
  { label: "Politics", path: "/politics" },
  { label: "World", path: "/world" },
  { label: "Entertainment", path: "/entertainment" },
  { label: "Business", path: "/business" },
  { label: "Technology", path: "/technology" },
  { label: "Education", path: "/education" },
  { label: "Health", path: "/health" },
  { label: "Environment", path: "/environment" },
];

export const sportsNavItems = [
  { label: "General", path: "/sports", slug: "general" },
  { label: "Football", path: "/sports/football", slug: "football" },
  { label: "Boxing", path: "/sports/boxing", slug: "boxing" },
  { label: "Olympics", path: "/sports/olympics", slug: "olympics" },
];

const sportsSlugSet = new Set(
  sportsNavItems
    .map((item) => item.slug)
    .filter((slug) => slug && slug !== "general"),
);

function titleizeSlug(slug) {
  return String(slug ?? "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getSportsPath(slug) {
  if (!slug || slug === "sports" || slug === "general") {
    return "/sports";
  }

  return `/sports/${slug}`;
}

function createSportsNavItem(item) {
  if (!item) {
    return null;
  }

  if (typeof item === "string") {
    return {
      label: titleizeSlug(item),
      path: getSportsPath(item),
      slug: item,
    };
  }

  const slug = item.slug ?? item.subcategory;
  if (!slug) {
    return null;
  }

  return {
    label: item.label ?? item.name ?? titleizeSlug(slug),
    path: item.path ?? getSportsPath(slug),
    slug,
  };
}

export function buildSportsNavItems(subcategories = []) {
  const source = Array.isArray(subcategories) && subcategories.length > 0
    ? subcategories
    : sportsNavItems;

  return Array.from(
    new Map(
      source
        .map(createSportsNavItem)
        .filter(Boolean)
        .map((item) => [item.slug, item]),
    ).values(),
  );
}

function createCategorySections(slug, title) {
  return [
    {
      key: `${slug}-headlines`,
      title: `${title} Headlines`,
      description: `Fresh coverage from the ${title.toLowerCase()} desk.`,
      source: "categoryArticles",
      categorySlug: slug,
      limit: 6,
      type: "article",
    },
    {
      key: `${slug}-trending`,
      title: "Trending With Readers",
      description: "High-engagement stories sorted from likes, comments, and shares.",
      source: "trendingArticles",
      categorySlug: slug,
      limit: 3,
      type: "article",
    },
    {
      key: `${slug}-videos`,
      title: `${title} Videos`,
      description: `Latest video coverage and standout clips from the ${title.toLowerCase()} desk.`,
      source: "categoryVideos",
      categorySlug: slug,
      limit: 3,
      type: "video",
    },
  ];
}

function createSportsSubcategorySections(slug, title) {
  return [
    {
      key: `${slug}-headlines`,
      title: `${title} Headlines`,
      description: `Fresh coverage from the ${title.toLowerCase()} desk.`,
      source: "categoryArticles",
      categorySlug: "sports",
      subcategorySlug: slug,
      limit: 6,
      type: "article",
    },
    {
      key: `${slug}-trending`,
      title: "Trending With Readers",
      description: "High-engagement stories sorted from likes, comments, and shares.",
      source: "trendingArticles",
      categorySlug: "sports",
      subcategorySlug: slug,
      limit: 3,
      type: "article",
    },
    {
      key: `${slug}-videos`,
      title: `${title} Videos`,
      description: `Latest video coverage and standout clips from the ${title.toLowerCase()} desk.`,
      source: "categoryVideos",
      categorySlug: "sports",
      subcategorySlug: slug,
      limit: 3,
      type: "video",
    },
  ];
}

function createCategoryPageConfig({
  slug,
  title,
  description,
  kicker = "Category Desk",
  showSportNav = false,
  highlights = [],
}) {
  return {
    slug,
    title,
    description,
    kicker,
    showSportNav,
    highlights,
    sections: createCategorySections(slug, title),
  };
}

function createSportsSubcategoryPageConfig({
  slug,
  title,
  description,
  kicker = "Sports Coverage",
  highlights = [],
}) {
  return {
    slug,
    title,
    description,
    kicker,
    showSportNav: true,
    highlights,
    sections: createSportsSubcategorySections(slug, title),
  };
}

export function getCategoryPath(slug) {
  if (!slug) {
    return "/";
  }

  if (slug === "sports" || slug === "general") {
    return "/sports";
  }

  if (sportsSlugSet.has(slug)) {
    return getSportsPath(slug);
  }

  return `/${slug}`;
}

export const pageConfigs = {
  home: {
    slug: "home",
    showSidebar: false,
    title: "Latest",
    kicker: "NATG TV",
    description:
      "Top headlines, breaking stories, and the latest coverage across Nigeria and beyond.",
    highlights: [
      "Breaking headlines",
      "Trending stories",
      "Fast desk access",
    ],

    sections: [
      {
        key: "home-latest",
        title: "Latest Headlines",
        description: "Newest stories from across the newsroom.",
        source: "latestArticles",
        limit: 12,
        type: "article",
      },
      {
        key: "home-trending",
        title: "Trending Now",
        description: "Stories readers are following most closely.",
        source: "trendingArticles",
        limit: 6,
        type: "article",
      },
      {
        key: "home-news-videos",
        title: "News Videos",
        description: "Watch the latest clips, reports, and newsroom highlights.",
        source: "videos",
        limit: 6,
        type: "video",
      },
      {
        key: "home-sports",
        title: "Sports Headlines",
        description: "General sports coverage from the main sports feed.",
        source: "categoryArticles",
        categorySlug: "sports",
        limit: 6,
        type: "article",
      },
      {
        key: "home-sports-videos",
        title: "Sport Videos",
        description: "Highlights, reaction, and watchable moments from the sports desk.",
        source: "categoryVideos",
        categorySlug: "sports",
        limit: 3,
        type: "video",
      },
      {
        key: "home-crime",
        title: "Crime Desk",
        description: "Breaking crime reports, investigations, and public safety updates.",
        source: "categoryArticles",
        categorySlug: "crime",
        limit: 3,
        type: "article",
      },
      {
        key: "home-politics",
        title: "Politics Desk",
        description: "Policy, elections, and the decisions shaping national life.",
        source: "categoryArticles",
        categorySlug: "politics",
        limit: 3,
        type: "article",
      },
      {
        key: "home-world",
        title: "World Briefing",
        description: "Global headlines and major international developments.",
        source: "categoryArticles",
        categorySlug: "world",
        limit: 3,
        type: "article",
      },
      {
        key: "home-entertainment",
        title: "Entertainment Desk",
        description: "Film, music, celebrity news, and the stories shaping culture.",
        source: "categoryArticles",
        categorySlug: "entertainment",
        limit: 3,
        type: "article",
      },
      {
        key: "home-business",
        title: "Business Desk",
        description: "Markets, companies, money, and the latest business headlines.",
        source: "categoryArticles",
        categorySlug: "business",
        limit: 3,
        type: "article",
      },
      {
        key: "home-technology",
        title: "Technology Desk",
        description: "Innovation, gadgets, platforms, and the tech stories shaping tomorrow.",
        source: "categoryArticles",
        categorySlug: "technology",
        limit: 3,
        type: "article",
      },
      {
        key: "home-education",
        title: "Education Desk",
        description: "Schools, policy, learning, and opportunities shaping education.",
        source: "categoryArticles",
        categorySlug: "education",
        limit: 3,
        type: "article",
      },
      {
        key: "home-health",
        title: "Health Desk",
        description: "Public health, medicine, wellness, and the stories that matter most.",
        source: "categoryArticles",
        categorySlug: "health",
        limit: 3,
        type: "article",
      },
      {
        key: "home-environment",
        title: "Environment Desk",
        description: "Climate, conservation, and environmental stories shaping communities.",
        source: "categoryArticles",
        categorySlug: "environment",
        limit: 3,
        type: "article",
      },
    ],
  },
  sports: {
    slug: "sports",
    title: "Sports Desk",
    kicker: "Sports Coverage",
    description:
      "Scores, analysis, fixtures, and standout stories from across the world of sport.",
    showSportNav: true,
    highlights: [
      "Football to Olympics",
      "Top stories and reaction",
      "Latest sports video updates",
    ],
    sections: [
      {
        key: "sports-headlines",
        title: "Sports Headlines",
        description: "General sports coverage from the main sports feed.",
        source: "categoryArticles",
        categorySlug: "sports",
        limit: 6,
        type: "article",
      },
      {
        key: "sports-football",
        title: "Football Focus",
        description: "Transfer news, match reports, and the biggest football talking points.",
        source: "categoryArticles",
        categorySlug: "sports",
        subcategorySlug: "football",
        limit: 3,
        type: "article",
      },
      {
        key: "sports-boxing",
        title: "Boxing Focus",
        description: "Fight nights, training camps, and the biggest boxing talking points.",
        source: "categoryArticles",
        categorySlug: "sports",
        subcategorySlug: "boxing",
        limit: 3,
        type: "article",
      },
      {
        key: "sports-olympics",
        title: "Olympics Watch",
        description: "Qualification races, medal hopes, and the biggest Olympic stories.",
        source: "categoryArticles",
        categorySlug: "sports",
        subcategorySlug: "olympics",
        limit: 3,
        type: "article",
      },
      {
        key: "sports-videos",
        title: "Matchday Videos",
        description: "Highlights, reaction, and watchable moments from the sports desk.",
        source: "categoryVideos",
        categorySlug: "sports",
        limit: 3,
        type: "video",
      },
    ],
  },
  crime: createCategoryPageConfig({
    slug: "crime",
    title: "Crime",
    description:
      "Breaking crime reports, investigations, and public safety updates.",
    highlights: [
      "Breaking reports",
      "Investigations and trials",
      "Public safety updates",
    ],
  }),
  politics: createCategoryPageConfig({
    slug: "politics",
    title: "Politics",
    description:
      "Policy, elections, and the decisions shaping national life.",
    highlights: [
      "Campaign trail coverage",
      "Policy and governance",
      "Daily political analysis",
    ],
  }),
  world: createCategoryPageConfig({
    slug: "world",
    title: "World",
    description:
      "Global headlines, diplomacy, and major developments from around the world.",
    highlights: [
      "Global headlines",
      "Diplomacy and conflict",
      "Cross-border developments",
    ],
  }),
  entertainment: createCategoryPageConfig({
    slug: "entertainment",
    title: "Entertainment",
    description:
      "Film, music, celebrity news, and the stories shaping culture.",
    highlights: [
      "Film and music",
      "Celebrity updates",
      "Culture and lifestyle",
    ],
  }),
  business: createCategoryPageConfig({
    slug: "business",
    title: "Business",
    description:
      "Markets, companies, money, and the latest business headlines.",
    highlights: [
      "Markets and companies",
      "Economy and trade",
      "Daily business watch",
    ],
  }),
  technology: createCategoryPageConfig({
    slug: "technology",
    title: "Technology",
    description:
      "Innovation, gadgets, platforms, and the tech stories shaping tomorrow.",
    highlights: [
      "Innovation and AI",
      "Gadgets and platforms",
      "Digital transformation",
    ],
  }),
  education: createCategoryPageConfig({
    slug: "education",
    title: "Education",
    description:
      "Schools, policy, learning, and opportunities shaping education.",
    highlights: [
      "Schools and policy",
      "Students and teachers",
      "Learning opportunities",
    ],
  }),
  health: createCategoryPageConfig({
    slug: "health",
    title: "Health",
    description:
      "Public health, medicine, wellness, and the stories that matter most.",
    highlights: [
      "Public health updates",
      "Medicine and research",
      "Wellness and care",
    ],
  }),
  environment: createCategoryPageConfig({
    slug: "environment",
    title: "Environment",
    description:
      "Climate, conservation, and environmental stories shaping communities.",
    highlights: [
      "Climate and resilience",
      "Conservation updates",
      "Community impact",
    ],
  }),
};

export const sportsPageConfigs = {
  football: createSportsSubcategoryPageConfig({
    slug: "football",
    title: "Football",
    description:
      "Football coverage with match reports, transfer updates, and sharp analysis.",
    highlights: [
      "Match reports",
      "Transfer updates",
      "Team news",
    ],
  }),
  boxing: createSportsSubcategoryPageConfig({
    slug: "boxing",
    title: "Boxing",
    description:
      "Fight nights, training camps, and the biggest boxing talking points.",
    highlights: [
      "Fight nights",
      "Camp updates",
      "Boxing analysis",
    ],
  }),
  olympics: createSportsSubcategoryPageConfig({
    slug: "olympics",
    title: "Olympics",
    description:
      "Qualification races, medal hopes, and the biggest Olympic stories.",
    highlights: [
      "Qualification races",
      "Medal hopefuls",
      "Olympic updates",
    ],
  }),
};

export function getSportsPageConfig(sportSlug) {
  if (!sportSlug || sportSlug === "general" || sportSlug === "sports") {
    return pageConfigs.sports;
  }

  return sportsPageConfigs[sportSlug] ?? createSportsSubcategoryPageConfig({
    slug: sportSlug,
    title: titleizeSlug(sportSlug),
    description: `${titleizeSlug(sportSlug)} coverage with the latest headlines, analysis, and standout moments.`,
    highlights: [
      "Latest headlines",
      "Standout moments",
      "Reaction and analysis",
    ],
  });
}
