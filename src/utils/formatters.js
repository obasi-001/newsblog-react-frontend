const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatPublishedDate(value) {
  if (!value) {
    return "No publish date";
  }

  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) {
    return "Just now";
  }

  return dateTimeFormatter.format(new Date(value));
}

export function formatCompactCount(value, label) {
  return `${value ?? 0} ${label}`;
}
