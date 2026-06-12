export function getApiErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data;
  const subscriberOnlyMessage =
    "This action can only be performed if you're a subscriber.";

  function normalizeMessage(message) {
    const trimmedMessage = message.trim();

    if (trimmedMessage === "Authentication credentials were not provided.") {
      return subscriberOnlyMessage;
    }

    return trimmedMessage;
  }

  if (typeof responseData === "string" && responseData.trim()) {
    if (responseData.trimStart().startsWith("<!DOCTYPE html>")) {
      return fallbackMessage;
    }

    return normalizeMessage(responseData);
  }

  if (typeof responseData?.detail === "string" && responseData.detail.trim()) {
    return normalizeMessage(responseData.detail);
  }

  if (responseData && typeof responseData === "object") {
    for (const value of Object.values(responseData)) {
      if (typeof value === "string" && value.trim()) {
        return normalizeMessage(value);
      }

      if (Array.isArray(value)) {
        const firstMessage = value.find(
          (item) => typeof item === "string" && item.trim(),
        );

        if (firstMessage) {
          return normalizeMessage(firstMessage);
        }
      }
    }
  }

  return fallbackMessage;
}
