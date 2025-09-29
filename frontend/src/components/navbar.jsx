import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Leaf } from "lucide-react";

function readAuthFromStorage() {
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [{ token, user }, setAuth] = useState(() => readAuthFromStorage());
  const isLoggedIn = Boolean(token);

  useEffect(() => {
    const onAuthChanged = () => setAuth(readAuthFromStorage());
    window.addEventListener("auth-changed", onAuthChanged);
    window.addEventListener("storage", onAuthChanged);
    return () => {
      window.removeEventListener("auth-changed", onAuthChanged);
      window.removeEventListener("storage", onAuthChanged);
    };
  }, []);

  useEffect(() => {
    setAuth(readAuthFromStorage());
  }, [location.pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    const keys = ["auth_token", "token", "user_token", "authToken", "auth_user", "userId", "tempUserId"];
    keys.forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });

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

  const tabClasses = ({ isActive }) =>
    [
      "relative px-4 py-2 text-sm font-medium transition-all duration-300 ease-out",
      "group overflow-hidden rounded-lg",
      isActive ? "text-green-700" : "text-gray-700 hover:text-green-600",
    ].join(" ");

  const avatarSrc =
    user?.profilePicture ||
    "https://ui-avatars.com/api/?background=10b981&color=fff&name=" +
      encodeURIComponent(`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User");

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-green-50/95 backdrop-blur-md border-b border-green-200 shadow-sm">
        {/* CHANGE #1: removed max-w cap so row can span full width */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand — anchored left */}
            <div className="flex-shrink-0">
              <NavLink 
                to="/" 
                className="flex items-center gap-2 group transition-transform duration-300 hover:scale-105"
              >
                <div className="relative">
                  <Leaf className="w-8 h-8 text-green-600 transition-transform duration-300 group-hover:rotate-12" />
                  <div className="absolute inset-0 bg-green-400 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-30" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent">
                  Green Grow
                </span>
              </NavLink>
            </div>

            {/* CHANGE #2: spacer pushes the right block fully to the edge */}
            <div className="hidden md:block flex-1" />

            {/* Desktop Navigation — pushed to the right */}
            <div className="hidden md:flex items-center gap-6">
              <ul className="flex items-center gap-1">
                {commonTabs.map((tab) => (
                  <li key={tab.name}>
                    <NavLink to={tab.to} className={tabClasses}>
                      {({ isActive }) => (
                        <>
                          <span className="relative z-10">{tab.name}</span>
                          <span 
                            className={`absolute inset-0 bg-green-50 rounded-lg transition-all duration-300 ease-out ${
                              isActive 
                                ? 'opacity-100 scale-100' 
                                : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
                            }`}
                          />
                          {isActive && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-green-600 rounded-full" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>

              {/* Auth Buttons */}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                {!isLoggedIn ? (
                  <>
                    <NavLink
                      to="/login"
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors duration-200"
                    >
                      Login
                    </NavLink>
                    <NavLink
                      to="/signup"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all duration-200 hover:shadow-lg hover:shadow-green-600/30"
                    >
                      Sign Up
                    </NavLink>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors duration-200"
                    >
                      Logout
                    </button>
                    <NavLink 
                      to="/profile" 
                      className="group relative"
                      title={`${user?.firstName || ""} ${user?.lastName || ""}`.trim()}
                    >
                      <img
                        src={avatarSrc}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover transition-all duration-300 group-hover:border-green-500 group-hover:shadow-lg group-hover:shadow-green-500/30"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 rounded-full bg-green-400 opacity-0 blur transition-opacity duration-300 group-hover:opacity-20" />
                    </NavLink>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-green-600 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pt-2 pb-4 space-y-1 bg-white border-t border-gray-100">
            {commonTabs.map((tab, index) => (
              <NavLink
                key={tab.name}
                to={tab.to}
                className={({ isActive }) =>
                  `block px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
                style={{
                  animation: mobileMenuOpen ? `slideIn 0.3s ease-out ${index * 0.05}s both` : 'none'
                }}
              >
                {tab.name}
              </NavLink>
            ))}
            
            <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
              {!isLoggedIn ? (
                <>
                  <NavLink
                    to="/login"
                    className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/signup"
                    className="block px-4 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-200 text-center"
                  >
                    Sign Up
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
                  >
                    <img
                      src={avatarSrc}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span>{`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Profile"}</span>
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 text-left"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16" />

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

export default Navbar;
