import { useEffect, useRef, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { hasStoredAuthToken } from "../auth";
import myNewsLogo from "../assets/my-news-logo.jpeg";
import { primaryNavItems } from "../config/pageConfig";
import { useTheme } from "../useTheme";

function Header({ searchTarget }) {
  const headerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const queryFromUrl = new URLSearchParams(location.search).get("search") ?? "";
  const searchSyncKey = `${location.pathname}?${queryFromUrl}`;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchDraft, setSearchDraft] = useState({
    key: searchSyncKey,
    value: queryFromUrl,
  });
  const searchValue =
    searchDraft.key === searchSyncKey ? searchDraft.value : queryFromUrl;

  useEffect(() => {
    function syncHeaderHeight() {
      if (!headerRef.current) {
        return;
      }

      document.documentElement.style.setProperty(
        "--news-header-height",
        `${headerRef.current.offsetHeight}px`,
      );
    }

    syncHeaderHeight();
    window.addEventListener("resize", syncHeaderHeight);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(syncHeaderHeight);

    if (headerRef.current && resizeObserver) {
      resizeObserver.observe(headerRef.current);
    }

    return () => {
      window.removeEventListener("resize", syncHeaderHeight);
      resizeObserver?.disconnect();
      document.documentElement.style.removeProperty("--news-header-height");
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function syncAuthState() {
      setIsAuthenticated(
        location.pathname === "/logout" ? false : hasStoredAuthToken(),
      );
    }

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("authchange", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("authchange", syncAuthState);
    };
  }, [location.pathname]);

  function handleSubmit(event) {
    event.preventDefault();

    const params = new URLSearchParams();
    const trimmedSearchValue = searchValue.trim();

    if (trimmedSearchValue) {
      params.set("search", trimmedSearchValue);
    }

    const targetPath = searchTarget ?? location.pathname;
    const nextUrl = params.toString() ? `${targetPath}?${params.toString()}` : targetPath;

    setIsMenuOpen(false);
    navigate(nextUrl);
  }

  function renderSearchForm(extraClassName = "") {
    return (
      <form
        role="search"
        className={`news-header__search ${extraClassName}`.trim()}
        onSubmit={handleSubmit}
      >
        <div className="news-header__search-form">
          <input
            type="search"
            className="news-header__search-input form-control"
            aria-label="Search stories and videos"
            placeholder="Search stories, videos, and topics"
            value={searchValue}
            onChange={(event) =>
              setSearchDraft({
                key: searchSyncKey,
                value: event.target.value,
              })
            }
          />
          <button type="submit" className="news-header__search-button btn btn-danger">
            Search
          </button>
        </div>
      </form>
    );
  }

  function renderAuthAction(extraClassName = "") {
    return (
      <div className={`news-header__auth ${extraClassName}`.trim()}>
        <Link
          to={isAuthenticated ? "/logout" : "/register"}
          onClick={() => setIsMenuOpen(false)}
          className="btn btn-danger rounded-pill px-3 py-2"
        >
          {isAuthenticated ? "Logout" : "Subscribe"}
        </Link>

        {!isAuthenticated ? (
          <Link
            to="/login"
            onClick={() => setIsMenuOpen(false)}
            className="btn btn-outline-secondary rounded-pill px-3 py-2"
          >
            Login
          </Link>
        ) : null}
      </div>
    );
  }

  function renderThemeToggle(extraClassName = "") {
    const Icon = theme === "dark" ? FiSun : FiMoon;

    return (
      <button
        type="button"
        className={`news-header__theme btn ${extraClassName}`.trim()}
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        <Icon size={18} />
      </button>
    );
  }

  function renderHeaderTools(extraClassName = "") {
    return (
      <div className={`news-header__tools ${extraClassName}`.trim()}>
        {renderThemeToggle()}
        {renderAuthAction()}
      </div>
    );
  }

  return (
    <>
      <nav ref={headerRef} className="news-header navbar border-bottom shadow-sm px-3 py-3">
        <div className="container-fluid px-0">
          <div className="news-header__inner w-100">
            <div className="news-header__bar">
              <div className="news-header__brand-block">
                <Link to="/" className="news-header__brand" aria-label="News Around The Globe home">
                  <img
                    src={myNewsLogo}
                    alt="News Around The Globe"
                    className="news-header__logo"
                  />
                </Link>
                <p className="news-header__meta small" aria-label="Breaking stories, sharp coverage, and updates across the globe">
                  <span className="news-header__ticker-track" aria-hidden="true">
                    <span className="news-header__ticker-item">
                      BREAKING STORIES, SHARP COVERAGE, AND UPDATES ACROSS THE GLOBE.
                    </span>
                    <span className="news-header__ticker-item">
                      BREAKING STORIES, SHARP COVERAGE, AND UPDATES ACROSS THE GLOBE.
                    </span>
                  </span>
                </p>
              </div>

              <div className="news-header__actions d-none d-lg-flex">
                {renderSearchForm()}
                {renderHeaderTools()}
              </div>

              <div className="news-header__mobile-actions d-lg-none">
                {renderThemeToggle("news-header__theme--mobile")}

                <button
                  type="button"
                  className={`news-header__toggle ${isMenuOpen ? "is-open" : ""}`.trim()}
                  aria-expanded={isMenuOpen}
                  aria-controls="mobile-navigation"
                  aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                  onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
                >
                  <span />
                  <span />
                  <span />
                </button>
              </div>
            </div>

            <div id="primary-navigation" className="news-header__menu d-none d-lg-flex">
              <div className="news-header__links news-header__links--desktop">
                {primaryNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `news-header__nav-link btn rounded-pill px-3 py-2 ${
                        isActive ? "btn-danger" : "btn-outline-secondary"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div
        id="mobile-navigation"
        className={`news-mobile-menu d-lg-none ${isMenuOpen ? "is-open" : ""}`.trim()}
        aria-hidden={!isMenuOpen}
      >
        <div className="news-mobile-menu__panel">
          {renderSearchForm()}

          <div className="news-header__status-wrap">
            {renderAuthAction()}
          </div>

          <div className="news-header__links news-header__links--mobile">
            {primaryNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `news-header__nav-link btn rounded-pill px-3 py-2 ${
                    isActive ? "btn-danger" : "btn-outline-secondary"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default Header;
