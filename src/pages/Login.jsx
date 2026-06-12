import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { ensureUserSubscription, loginUser, storeAuthTokens } from "../auth";
import { getApiErrorMessage } from "../utils/apiErrors";

function shouldRetryWithUsername(error) {
  const payload = error?.response?.data;

  if (error?.response?.status !== 400 || !payload || typeof payload !== "object") {
    return false;
  }

  if (payload.detail || payload.non_field_errors || payload.password) {
    return false;
  }

  return Boolean(payload.email || payload.username);
}

async function attemptLogin(identifier, password) {
  const trimmedIdentifier = identifier.trim();

  if (trimmedIdentifier.includes("@")) {
    try {
      return await loginUser({ email: trimmedIdentifier, password });
    } catch (error) {
      if (!shouldRetryWithUsername(error)) {
        throw error;
      }
    }
  }

  return loginUser({ username: trimmedIdentifier, password });
}

function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload = await attemptLogin(identifier, password);
      const tokens = payload?.tokens ?? payload;

      if (tokens?.access || tokens?.refresh) {
        storeAuthTokens(tokens);
        try {
          await ensureUserSubscription();
        } catch (subscriptionError) {
          setError(
            getApiErrorMessage(
              subscriptionError,
              "You are signed in, but we could not activate your subscription right now.",
            ),
          );
          return;
        }
      }

      navigate("/", { replace: true });
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          "We could not log you in right now.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      kicker="Login"
      title="Welcome back"
      description="Sign in with your username or email, then continue reading from the newsroom with your subscription activated automatically."
    >
      <div className="auth-copy mb-4">
        <h2 className="h3 mb-2">Login</h2>
        <p className="text-secondary mb-0">
          Enter your details below to sign in.
        </p>
      </div>

      {error ? (
        <div className="alert alert-danger rounded-4" role="alert">
          {error}
        </div>
      ) : null}

      <form className="auth-form d-flex flex-column gap-3" onSubmit={handleSubmit}>
        <div>
          <label className="form-label fw-semibold" htmlFor="login-identifier">
            Username or email
          </label>
          <input
            id="login-identifier"
            type="text"
            className="form-control auth-input"
            placeholder="Enter your username or email"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />
        </div>

        <div>
          <div className="d-flex justify-content-between align-items-center gap-3 mb-2">
            <label className="form-label fw-semibold mb-0" htmlFor="login-password">
              Password
            </label>
            <Link to="/reset-password" className="auth-inline-link">
              Forgot password?
            </Link>
          </div>
          <div className="position-relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              className="form-control auth-input pe-5"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="btn btn-link position-absolute top-50 end-0 translate-middle-y px-3 text-secondary"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-danger rounded-pill px-4 py-2 align-self-start"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </form>

      <p className="auth-note text-secondary mt-4 mb-0">
        Need an account? <Link to="/register">Register here</Link>.
      </p>
    </AuthLayout>
  );
}

export default Login;
