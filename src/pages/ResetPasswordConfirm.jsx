import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { confirmPasswordReset } from "../auth";
import { getApiErrorMessage } from "../utils/apiErrors";

function useResetTokens() {
  const { uidb64, token } = useParams();
  const location = useLocation();

  return useMemo(() => {
    const query = new URLSearchParams(location.search);

    return {
      uid:
        uidb64 ??
        query.get("uidb64") ??
        query.get("uid") ??
        query.get("user"),
      token: token ?? query.get("token"),
    };
  }, [location.search, token, uidb64]);
}

function ResetPasswordConfirm() {
  const { uid, token } = useResetTokens();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!uid || !token) {
      setError("This reset link is incomplete. Please request a new one.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match yet. Please retype them.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await confirmPasswordReset({
        uid,
        token,
        password,
        password2: confirmPassword,
      });

      setSuccess(
        response?.message || "Your password has been reset successfully.",
      );
      setPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          "We could not reset your password right now.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      kicker="New Password"
      title="Choose a new password"
      description="Open the link from your email, then set a new password for your account."
    >
      <div className="auth-copy mb-4">
        <h2 className="h3 mb-2">Reset password</h2>
        <p className="text-secondary mb-0">
          Enter your new password twice to finish resetting your account.
        </p>
      </div>

      {!uid || !token ? (
        <div className="alert alert-warning rounded-4" role="alert">
          We could not find a valid reset token in this link. <Link to="/reset-password">Request a new reset link</Link>.
        </div>
      ) : null}

      {error ? (
        <div className="alert alert-danger rounded-4" role="alert">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="alert alert-success rounded-4" role="alert">
          {success} <Link to="/login">Go to login</Link>.
        </div>
      ) : null}

      <form className="auth-form d-flex flex-column gap-3" onSubmit={handleSubmit}>
        <div>
          <label className="form-label fw-semibold" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            className="form-control auth-input"
            placeholder="Enter your new password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="form-label fw-semibold" htmlFor="confirm-new-password">
            Retype password
          </label>
          <input
            id="confirm-new-password"
            type="password"
            className="form-control auth-input"
            placeholder="Retype your new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-danger rounded-pill px-4 py-2 align-self-start"
          disabled={isSubmitting || !uid || !token}
        >
          {isSubmitting ? "Updating..." : "Reset password"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default ResetPasswordConfirm;
