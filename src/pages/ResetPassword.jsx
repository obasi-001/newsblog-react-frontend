import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { requestPasswordReset } from "../auth";
import { getApiErrorMessage } from "../utils/apiErrors";

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await requestPasswordReset(email);

      setSuccess(
        response?.message ||
          `If ${email.trim()} exists in the system, a reset link has been sent.`,
      );
      setEmail("");
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          "We could not send a reset link right now.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      kicker="Reset Password"
      title="Reset your password"
      description="Enter your email address and we will send you a reset link if your account is available."
    >
      <div className="auth-copy mb-4">
        <h2 className="h3 mb-2">Forgot password</h2>
        <p className="text-secondary mb-0">
          Enter your email address below to request a password reset.
        </p>
      </div>

      {error ? (
        <div className="alert alert-danger rounded-4" role="alert">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="alert alert-success rounded-4" role="alert">
          {success}
        </div>
      ) : null}

      <form className="auth-form d-flex flex-column gap-3" onSubmit={handleSubmit}>
        <div>
          <label className="form-label fw-semibold" htmlFor="reset-email">
            Email
          </label>
          <input
            id="reset-email"
            type="email"
            className="form-control auth-input"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-danger rounded-pill px-4 py-2 align-self-start"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="auth-note text-secondary mt-4 mb-0">
        Remembered it? <Link to="/login">Back to login</Link>.
      </p>
    </AuthLayout>
  );
}

export default ResetPassword;
