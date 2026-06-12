import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import {
  ensureUserSubscription,
  registerUser,
  resendEmailVerification,
  storeAuthTokens,
} from "../auth";
import { getApiErrorMessage } from "../utils/apiErrors";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setResendMessage("");
    setResendError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match yet. Please retype them.");
      return;
    }

    setIsSubmitting(true);
    const email = formData.email.trim();

    try {
      const payload = await registerUser({
        email,
        username: formData.username.trim(),
        password: formData.password,
        password2: formData.confirmPassword,
      });
      const tokens = payload?.tokens ?? payload;

      if (tokens?.access || tokens?.refresh) {
        storeAuthTokens(tokens);
        try {
          await ensureUserSubscription();
        } catch (subscriptionError) {
          setError(
            getApiErrorMessage(
              subscriptionError,
              "Your account was created, but we could not activate your subscription right now.",
            ),
          );
          return;
        }

        navigate("/", { replace: true });
        return;
      }

      setSuccess(
        payload?.message
          || "Your account has been created. Check your email for the verification link.",
      );
      setVerificationEmail(email);
      setFormData({
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
      });
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          "We could not create your account right now.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendVerification() {
    const email = (verificationEmail || formData.email).trim();

    setResendMessage("");
    setResendError("");

    if (!email) {
      setResendError("Enter your email address first so we can resend the verification link.");
      return;
    }

    setIsResendingVerification(true);

    try {
      const response = await resendEmailVerification(email);
      setVerificationEmail(email);
      setResendMessage(
        response?.message || `A new verification link has been sent to ${email}.`,
      );
    } catch (resendVerificationError) {
      setResendError(
        getApiErrorMessage(
          resendVerificationError,
          "We could not resend the verification email right now.",
        ),
      );
    } finally {
      setIsResendingVerification(false);
    }
  }

  return (
    <AuthLayout
      kicker="Subscribe"
      title="Create your NATG TV account"
      description="Register with your email, username, password, and confirmation password. Your subscription activates automatically after sign-in."
    >
      <div className="auth-copy mb-4">
        <h2 className="h3 mb-2">Register</h2>
        <p className="text-secondary mb-0">
          Fill in the details below to create your account and unlock your subscription automatically.
        </p>
      </div>

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
          <label className="form-label fw-semibold" htmlFor="register-email">
            Email
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            className="form-control auth-input"
            placeholder="you@example.com"
            value={formData.email}
            onChange={updateField}
            required
          />
        </div>

        <div>
          <label className="form-label fw-semibold" htmlFor="register-username">
            Username
          </label>
          <input
            id="register-username"
            name="username"
            type="text"
            className="form-control auth-input"
            placeholder="Choose a username"
            value={formData.username}
            onChange={updateField}
            required
          />
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="register-password">
              Password
            </label>
            <div className="position-relative">
              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="form-control auth-input pe-5"
                placeholder="Enter your password"
                value={formData.password}
                onChange={updateField}
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

          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="register-confirm-password">
              Retype password
            </label>
            <div className="position-relative">
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="form-control auth-input pe-5"
                placeholder="Retype your password"
                value={formData.confirmPassword}
                onChange={updateField}
                required
              />
              <button
                type="button"
                className="btn btn-link position-absolute top-50 end-0 translate-middle-y px-3 text-secondary"
                aria-label={showConfirmPassword ? "Hide retyped password" : "Show retyped password"}
                aria-pressed={showConfirmPassword}
                onClick={() => setShowConfirmPassword((current) => !current)}
              >
                {showConfirmPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-danger rounded-pill px-4 py-2 align-self-start"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="auth-feature-card mt-4">
        <h3 className="h6 mb-2">Need another verification email?</h3>
        <p className="text-secondary small mb-3">
          Use the email from your registration and we will send a fresh verification link.
        </p>
        <div className="d-flex flex-column flex-sm-row gap-2">
          <input
            type="email"
            className="form-control auth-input"
            placeholder="Enter your email"
            value={verificationEmail || formData.email}
            onChange={(event) => setVerificationEmail(event.target.value)}
          />
          <button
            type="button"
            className="btn btn-outline-secondary rounded-pill px-4 py-2 flex-shrink-0"
            disabled={isResendingVerification}
            onClick={handleResendVerification}
          >
            {isResendingVerification ? "Sending..." : "Resend link"}
          </button>
        </div>

        {resendMessage ? (
          <div className="alert alert-success rounded-4 mt-3 mb-0" role="alert">
            {resendMessage}
          </div>
        ) : null}

        {resendError ? (
          <div className="alert alert-danger rounded-4 mt-3 mb-0" role="alert">
            {resendError}
          </div>
        ) : null}
      </div>

      <p className="auth-note text-secondary mt-4 mb-0">
        Already have an account? <Link to="/login">Login here</Link>.
      </p>
    </AuthLayout>
  );
}

export default Register;
