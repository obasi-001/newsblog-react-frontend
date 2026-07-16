import API from "./axios";
export {
  clearAuthTokens,
  getStoredAccessToken,
  hasStoredAuthToken,
  storeAuthTokens,
} from "./authStorage";
import { getApiErrorMessage } from "./utils/apiErrors";

const passwordResetRequestCandidates = [
  {
    url: "auth/forgot-password/",
    buildData: (email) => ({ email }),
  },
];

const passwordResetConfirmCandidates = [
  {
    url: ({ uid, token }) => `auth/reset-password/${uid}/${token}/`,
    buildData: ({ password, password2 }) => ({
      password,
      password2,
    }),
  },
];

const emailVerificationResendCandidates = [
  {
    url: "auth/resend-email-verification/",
    buildData: (email) => ({ email }),
  },
  {
    url: "auth/resend-verification/",
    buildData: (email) => ({ email }),
  },
  {
    url: "auth/email/resend-verification/",
    buildData: (email) => ({ email }),
  },
  {
    url: "auth/verify/resend/",
    buildData: (email) => ({ email }),
  },
  {
    url: "auth/users/resend_activation/",
    buildData: (email) => ({ email }),
  },
];

function matchesActiveSubscriptionState(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["active", "subscribed", "enabled", "true"].includes(
      value.trim().toLowerCase(),
    );
  }

  return false;
}

function hasActiveSubscription(payload) {
  if (matchesActiveSubscriptionState(payload)) {
    return true;
  }

  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidates = [
    payload.subscribed,
    payload.is_subscribed,
    payload.active,
    payload.is_active,
    payload.status,
    payload.subscription_status,
    payload.subscription?.subscribed,
    payload.subscription?.is_subscribed,
    payload.subscription?.active,
    payload.subscription?.is_active,
    payload.subscription?.status,
  ];

  return candidates.some(matchesActiveSubscriptionState);
}

function isAlreadySubscribedError(error) {
  const status = error?.response?.status;
  const message = getApiErrorMessage(error, "").trim().toLowerCase();

  return (
    status === 409
    || (
      message.includes("already")
      && (message.includes("subscriber") || message.includes("subscription"))
    )
  );
}

function isMissingSubscriptionEndpoint(error) {
  return [404, 405].includes(error?.response?.status);
}

async function requestFirstAvailable(candidates, payload) {
  let lastError = null;

  for (const candidate of candidates) {
    try {
      const url =
        typeof candidate.url === "function" ? candidate.url(payload) : candidate.url;
      const response = await API.post(url, candidate.buildData(payload));
      return response.data;
    } catch (error) {
      lastError = error;

      if (![404, 405].includes(error?.response?.status)) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error("No matching auth endpoint is available.");
}

export const loginUser = async (data) => {
  const response = await API.post("auth/login/", data);
  return response.data;
};

export const registerUser = async (data) => {
  const response = await API.post("auth/register/", data);
  return response.data;
};

export const verifyEmail = async (uid, token) => {
  const response = await API.get(`auth/verify/${uid}/${token}/`, {
    skipAuth: true,
  });
  return response.data;
};

export const resendEmailVerification = async (email) =>
  requestFirstAvailable(emailVerificationResendCandidates, email.trim());

export const requestPasswordReset = async (email) =>
  requestFirstAvailable(passwordResetRequestCandidates, email.trim());

export const confirmPasswordReset = async ({ uid, token, password, password2 }) =>
  requestFirstAvailable(passwordResetConfirmCandidates, {
    uid,
    token,
    password,
    password2,
  });

export const refreshUserToken = async (data) => {
  const response = await API.post("auth/token/refresh/", data);
  return response.data;
};

export const getUserProfile = async () => {
  const response = await API.get("auth/profile/");
  return response.data;
};

export const updateUserProfile = async (data) => {
  const response = await API.patch("auth/profile/", data);
  return response.data;
};

export const subscribeUser = async () => {
  const response = await API.post("subscription/subscribe/");
  return response.data;
};

export const getSubscriptionStatus = async () => {
  const response = await API.get("subscription/status/");
  return response.data;
};

export const unsubscribeUser = async () => {
  const response = await API.post("subscription/unsubscribe/");
  return response.data;
};

export const ensureUserSubscription = async () => {
  try {
    const statusPayload = await getSubscriptionStatus();

    if (hasActiveSubscription(statusPayload)) {
      return statusPayload;
    }
  } catch (statusError) {
    if (isMissingSubscriptionEndpoint(statusError)) {
      return { subscribed: false, subscriptionEndpointAvailable: false };
    }

    // Fall through to the subscribe endpoint when status is unavailable
    // or the backend does not expose a stable status payload.
  }

  try {
    return await subscribeUser();
  } catch (error) {
    if (isAlreadySubscribedError(error) || isMissingSubscriptionEndpoint(error)) {
      return { subscribed: true };
    }

    throw error;
  }
};
