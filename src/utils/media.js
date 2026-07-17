export function getRetriedMediaUrl(mediaUrl) {
  const url = String(mediaUrl ?? "").trim();

  if (!url) return "";

  const retryValue = Date.now().toString();

  try {
    const retriedUrl = new URL(url, window.location.href);
    retriedUrl.searchParams.set("retry", retryValue);
    return retriedUrl.toString();
  } catch {
    return `${url}${url.includes("?") ? "&" : "?"}retry=${retryValue}`;
  }
}
