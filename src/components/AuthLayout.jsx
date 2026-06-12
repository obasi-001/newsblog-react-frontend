import { NavLink } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const authLinks = [
  { label: "Register", path: "/register" },
  { label: "Login", path: "/login" },
  { label: "Reset Password", path: "/reset-password" },
];

function AuthLayout({ kicker, title, description, children }) {
  return (
    <>
      <Header searchTarget="/" />

      <main className="auth-shell container py-4 py-lg-5">
        <div className="row g-4 align-items-stretch">
          <section className="col-lg-5 d-none d-lg-block">
            <div className="auth-hero border rounded-4 shadow-sm p-4 p-lg-5 h-100">
              <span className="badge text-bg-danger rounded-pill px-3 py-2">
                {kicker}
              </span>

              <h1 className="display-6 fw-semibold mt-4 mb-3">{title}</h1>
              <p className="lead text-secondary mb-4">{description}</p>

              <div className="auth-quick-links d-flex flex-wrap gap-2">
                {authLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `btn rounded-pill px-3 py-2 ${
                        isActive ? "btn-danger" : "btn-outline-secondary"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>

              <div className="auth-feature-grid row g-3 mt-2">
                <div className="col-sm-6 col-lg-12">
                  <div className="auth-feature-card h-100">
                    <h2 className="h6 mb-2">Create your account</h2>
                    <p className="text-secondary mb-0">
                      Subscribe to NATG TV with your email, username, and password.
                    </p>
                  </div>
                </div>

                <div className="col-sm-6 col-lg-12">
                  <div className="auth-feature-card h-100">
                    <h2 className="h6 mb-2">Sign in anytime</h2>
                    <p className="text-secondary mb-0">
                      Use your account to move quickly between the newsroom and your auth pages.
                    </p>
                  </div>
                </div>

                <div className="col-sm-12 col-lg-12">
                  <div className="auth-feature-card h-100">
                    <h2 className="h6 mb-2">Reset from your email link</h2>
                    <p className="text-secondary mb-0">
                      Request a reset email, then open the link to choose a new password.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="col-12 col-lg-7">
            <div className="auth-card bg-white border rounded-4 shadow-sm p-4 p-lg-5">
              {children}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default AuthLayout;
