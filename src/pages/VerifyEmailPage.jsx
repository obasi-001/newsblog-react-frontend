import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Loader from "../components/Loader";
import { verifyEmail } from "../auth";

function VerifyEmailPage() {
  const { uid, token } = useParams();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function runVerification() {
      if (!uid || !token) {
        if (!cancelled) {
          setStatus("error");
        }
        return;
      }

      try {
        await verifyEmail(uid, token);

        if (!cancelled) {
          setStatus("success");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    runVerification();

    return () => {
      cancelled = true;
    };
  }, [token, uid]);

  return (
    <AuthLayout
      kicker="Verify Email"
      title="Email verification"
      description="We are checking your verification link so you can continue into the app."
    >
      {status === "loading" ? <Loader label="Verifying your email..." /> : null}

      {status === "success" ? (
        <>
          <div className="alert alert-success rounded-4 mb-4" role="alert">
            <h2 className="h5 mb-2">Email verified successfully</h2>
            <p className="mb-0">Your account is now active. You can login.</p>
          </div>

          <Link to="/login" className="btn btn-danger rounded-pill px-4 py-2">
            Go to login
          </Link>
        </>
      ) : null}

      {status === "error" ? (
        <div className="alert alert-danger rounded-4 mb-0" role="alert">
          Invalid or expired verification link
        </div>
      ) : null}
    </AuthLayout>
  );
}

export default VerifyEmailPage;
