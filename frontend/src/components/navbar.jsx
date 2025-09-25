import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

function readAuthFromStorage() {
  // Check localStorage then sessionStorage for common keys
  const get = (k) => localStorage.getItem(k) ?? sessionStorage.getItem(k);

  const token =
    get("auth_token") ||
    get("token") ||
    get("user_token") ||
    get("authToken") ||
    "";

  let user = null;
  const rawUser = get("auth_user");
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      user = null;
    }
  }
  return { token, user };
}

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [{ token, user }, setAuth] = useState(() => readAuthFromStorage());
  const isLoggedIn = Boolean(token);

  // refresh navbar when auth changes, route changes, or storage changes (other tabs)
  useEffect(() => {
    const onAuthChanged = () => setAuth(readAuthFromStorage());
    window.addEventListener("auth-changed", onAuthChanged);
    window.addEventListener("storage", onAuthChanged);
    return () => {
      window.removeEventListener("auth-changed", onAuthChanged);
      window.removeEventListener("storage", onAuthChanged);
    };
  }, []);

  // also refresh when route changes (covers same-tab login navigations)
  useEffect(() => {
    setAuth(readAuthFromStorage());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleLogout = () => {
    // remove from both storages, regardless of where they were saved
    const keys = ["auth_token", "token", "user_token", "authToken", "auth_user", "userId", "tempUserId"];
    keys.forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });

    // notify listeners
    window.dispatchEvent(new Event("auth-changed"));

    navigate("/login");
  };

  const commonTabs = [
    { name: "Home", to: "/" },
    { name: "Consultant", to: "/SearchCon" },
    { name: "Events", to: "/events" },
    { name: "Community", to: "/community" },
    { name: "Tutorials", to: "/coursepage" },
    { name: "About Us", to: "/about" },
  ];

  // style helper
  const tabClasses = ({ isActive }) =>
    [
      "inline-block px-3 py-3 text-sm font-medium transition-colors",
      "border-b-2 -mb-[1px]",
      isActive
        ? "border-green-600 text-green-700"
        : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40 rounded-sm",
    ].join(" ");

  const avatarSrc =
    user?.profilePicture ||
    "https://ui-avatars.com/api/?background=E6F4EA&color=166534&name=" +
      encodeURIComponent(`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User");

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left: Brand */}
        <div className="text-xl font-bold text-green-700 select-none">
          Green Grow
        </div>

        {/* Right: Tabs + (conditional) profile */}
        <div className="flex items-center gap-4">
          <ul className="flex items-center gap-4">
            {commonTabs.map((tab) => (
              <li key={tab.name}>
                <NavLink to={tab.to} className={tabClasses}>
                  {tab.name}
                </NavLink>
              </li>
            ))}

            {!isLoggedIn ? (
              <>
                <li>
                  <NavLink to="/login" className={tabClasses}>
                    Login
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/signup" className={tabClasses}>
                    SignUp
                  </NavLink>
                </li>
              </>
            ) : (
              <li>
                <button
                  onClick={handleLogout}
                  className="inline-block px-3 py-3 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                >
                  Logout
                </button>
              </li>
            )}
          </ul>

          {/* Profile picture at far right (only when logged in) */}
          {isLoggedIn && (
            <NavLink to="/profile" className="shrink-0" title={`${user?.firstName || ""} ${user?.lastName || ""}`.trim()}>
              <img
                src={avatarSrc}
                alt="Profile"
                className="w-10 h-10 rounded-full border border-gray-300 object-cover"
                referrerPolicy="no-referrer"
              />
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
