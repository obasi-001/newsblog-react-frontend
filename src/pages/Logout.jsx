import { useEffect } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { clearAuthTokens } from "../auth";

function Logout() {
  useEffect(() => {
    clearAuthTokens();
  }, []);

  return (
    <AuthLayout
      kicker="Logout"
      title="You have been signed out"
      description="Your saved auth tokens have been cleared from this browser."
    >
      <div className="auth-copy mb-4">
        <h2 className="h3 mb-2">Logout complete</h2>
        <p className="text-secondary mb-0">
          You can go back to the homepage, log in again, or create another account.
        </p>
      </div>

      <div className="alert alert-success rounded-4" role="alert">
        You are now logged out.
      </div>

      <div className="d-flex flex-wrap gap-2">
        <Link to="/" className="btn btn-danger rounded-pill px-4 py-2">
          Return home
        </Link>
        <Link to="/login" className="btn btn-outline-secondary rounded-pill px-4 py-2">
          Login again
        </Link>
        <Link to="/register" className="btn btn-outline-secondary rounded-pill px-4 py-2">
          Subscribe
        </Link>
      </div>
    </AuthLayout>
  );
}

export default Logout;
