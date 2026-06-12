import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Loader from "../components/Loader";
import { verifyEmail } from "../auth";
import { getApiErrorMessage } from "../utils/apiErrors";

function VerifyEmail() {
  const { uidb64, token } = useParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Checking your verification link...");

  useEffect(() => {
    let cancelled = false;

    async function runVerification() {
      if (!uidb64 || !token) {
        if (!cancelled) {
          setStatus("error");
          setMessage("This verification link is incomplete.");
        }
        return;
      }

      try {
        const response = await verifyEmail(uidb64, token);

        if (!cancelled) {
          setStatus("success");
          setMessage(
            response?.message || "Your email has been verified successfully.",
          );
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(
            getApiErrorMessage(
              error,
              "We could not verify your email right now.",
            ),
          );
        }
      }
    }

    runVerification();

    return () => {
      cancelled = true;
    };
  }, [token, uidb64]);

  return (
    <AuthLayout
      kicker="Verify Email"
      title="Email verification"
      description="We are checking your verification link so you can continue into the app."
    >
      {status === "loading" ? <Loader label={message} /> : null}

      {status === "success" ? (
        <div className="alert alert-success rounded-4 mb-4" role="alert">
          {message}
        </div>
      ) : null}

      {status === "error" ? (
        <div className="alert alert-danger rounded-4 mb-4" role="alert">
          {message}
        </div>
      ) : null}

      {status !== "loading" ? (
        <div className="d-flex flex-wrap gap-2">
          <Link to="/login" className="btn btn-danger rounded-pill px-4 py-2">
            Continue to login
          </Link>
          <Link to="/register" className="btn btn-outline-secondary rounded-pill px-4 py-2">
            Back to register
          </Link>
        </div>
      ) : null}
    </AuthLayout>
  );
}

export default VerifyEmail;
