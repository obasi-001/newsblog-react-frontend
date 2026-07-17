import { memo, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { getSportsSubcategories } from "../api/newsApi";
import { buildSportsNavItems } from "../config/pageConfig";

function SportNav() {
  const [navItems, setNavItems] = useState(() => buildSportsNavItems());

  useEffect(() => {
    let cancelled = false;

    async function loadSportsTabs() {
      try {
        const subcategories = await getSportsSubcategories();

        if (!cancelled && subcategories.length > 0) {
          setNavItems(buildSportsNavItems(subcategories));
        }
      } catch (error) {
        console.error("Failed to load sports subcategories:", error);
      }
    }

    loadSportsTabs();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="sports-nav bg-danger rounded-4 shadow-sm py-2 px-2">
      <div className="d-flex flex-row flex-nowrap gap-2 overflow-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/sports"}
            className={({ isActive }) =>
              `nav-link rounded-pill px-3 py-2 text-nowrap ${
                isActive ? "active bg-white text-danger fw-semibold" : "text-white"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default memo(SportNav);
