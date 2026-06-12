// import { NavLink } from "react-router-dom";
// import { primaryNavItems, sportsNavItems } from "../config/pageConfig";

// const newsroomNotes = [
//   "Latest headlines update throughout the day.",
//   "Search filters stories and videos on the current page.",
//   "Sports topics open dedicated desk pages.",
//   "Video sections will grow as more clips are published.",
// ];

// function Sidebar() {
//   return (
//     <div className="sidebar-card d-flex flex-column gap-4">
//       <section className="bg-white border rounded-4 shadow-sm p-4">
//         <h2 className="h5 mb-3">Channels</h2>
//         <div className="d-flex flex-column gap-2">
//           {primaryNavItems.map((item) => (
//             <NavLink
//               key={item.path}
//               to={item.path}
//               end={item.path === "/"}
//               className={({ isActive }) =>
//                 `text-decoration-none rounded-3 px-3 py-2 ${
//                   isActive ? "bg-danger-subtle text-danger" : "text-dark bg-light"
//                 }`
//               }
//             >
//               {item.label}
//             </NavLink>
//           ))}
//         </div>
//       </section>

//       <section className="bg-white border rounded-4 shadow-sm p-4">
//         <h2 className="h5 mb-3">Sports</h2>
//         <div className="d-flex flex-column gap-2">
//           {sportsNavItems.slice(1).map((item) => (
//             <NavLink
//               key={item.path}
//               to={item.path}
//               className={({ isActive }) =>
//                 `text-decoration-none rounded-3 px-3 py-2 ${
//                   isActive ? "bg-dark text-white" : "text-dark bg-light"
//                 }`
//               }
//             >
//               {item.label}
//             </NavLink>
//           ))}
//         </div>
//       </section>

//       <section className="bg-dark text-white rounded-4 shadow-sm p-4">
//         <h2 className="h5 mb-3">Newsroom Notes</h2>
//         <ul className="small mb-0 ps-3">
//           {newsroomNotes.map((note) => (
//             <li key={note} className="mb-2">
//               {note}
//             </li>
//           ))}
//         </ul>
//       </section>
//     </div>
//   );
// }

// export default Sidebar;

import { NavLink } from "react-router-dom";
import { getCategoryPath } from "../config/pageConfig";

const newsroomNotes = [
  "Latest headlines update throughout the day.",
  "Search filters stories and videos on the current page.",
  "Sports topics open dedicated desk pages.",
  "Video sections will grow as more clips are published.",
];

function Sidebar({ categories = [] }) {
  // Split categories into primary and sports
  const primaryCategories = categories.filter(
    (cat) => cat.group !== "sports"
  );
  const sportsCategories = categories.filter(
    (cat) => cat.group === "sports"
  );

  return (
    <div className="sidebar-card d-flex flex-column gap-4">
      {/* Channels */}
      <section className="bg-white border rounded-4 shadow-sm p-4">
        <h2 className="h5 mb-3">Channels</h2>
        <div className="d-flex flex-column gap-2">
          {primaryCategories.length > 0 ? (
            primaryCategories.map((cat) => (
              <NavLink
                key={cat.slug}
                to={getCategoryPath(cat.slug)}
                className={({ isActive }) =>
                  `text-decoration-none rounded-3 px-3 py-2 ${
                    isActive ? "bg-danger-subtle text-danger" : "text-dark bg-light"
                  }`
                }
              >
                {cat.name}
              </NavLink>
            ))
          ) : (
            <p className="text-muted small">Loading categories...</p>
          )}
        </div>
      </section>

      {/* Sports */}
      <section className="bg-white border rounded-4 shadow-sm p-4">
        <h2 className="h5 mb-3">Sports</h2>
        <div className="d-flex flex-column gap-2">
          {sportsCategories.length > 0 ? (
            sportsCategories.map((cat) => (
              <NavLink
                key={cat.slug}
                to={getCategoryPath(cat.slug)}
                className={({ isActive }) =>
                  `text-decoration-none rounded-3 px-3 py-2 ${
                    isActive ? "bg-dark text-white" : "text-dark bg-light"
                  }`
                }
              >
                {cat.name}
              </NavLink>
            ))
          ) : (
            <p className="text-muted small">Loading sports...</p>
          )}
        </div>
      </section>

      {/* Newsroom Notes */}
      <section className="bg-dark text-white rounded-4 shadow-sm p-4">
        <h2 className="h5 mb-3">Newsroom Notes</h2>
        <ul className="small mb-0 ps-3">
          {newsroomNotes.map((note, index) => (
            <li key={index} className="mb-2">
              {note}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default Sidebar;
