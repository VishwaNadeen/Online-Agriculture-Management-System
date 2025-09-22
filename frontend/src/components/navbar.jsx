// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  const commonTabs = [
    { name: "Home", to: "/" },
    { name: "Appointment", to: "/appointment" },
   //{ name: "AppointmentDetails", to: "/appointments" },
    { name: "Events", to: "/events" },
    { name: "Community Forum", to: "/community" },
    { name: "Tutorials", to: "/tutorials" },
    { name: "About Us", to: "/about" },
  ];

  // A small helper to keep the “tab” style consistent
  const tabClasses = ({ isActive }) =>
    [
      "inline-block px-3 py-3 text-sm font-medium transition-colors",
      // draw a bottom border like nav-tabs; negative margin keeps the border flush with navbar bottom
      "border-b-2 -mb-[1px]",
      isActive
        ? "border-green-600 text-green-700"
        : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40 rounded-sm",
    ].join(" ");

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
            <NavLink to="/profile" className="shrink-0">
              <img
                src="https://via.placeholder.com/40"
                alt="Profile"
                className="w-10 h-10 rounded-full border border-gray-300 object-cover"
              />
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
