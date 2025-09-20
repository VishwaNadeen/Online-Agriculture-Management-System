// src/components/Footer.jsx
import React from "react";
import { NavLink } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-green-700 text-white mt-12">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Brand & About */}
        <div>
          <h2 className="text-2xl font-bold">Green Grow</h2>
          <p className="mt-3 text-sm text-gray-200">
            Your trusted partner in agriculture management.  
            Learn, connect, and grow with us.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <NavLink to="/" className="hover:underline">
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className="hover:underline">
                About Us
              </NavLink>
            </li>
            <li>
              <NavLink to="/tutorials" className="hover:underline">
                Tutorials
              </NavLink>
            </li>
            <li>
              <NavLink to="/community" className="hover:underline">
                Community Forum
              </NavLink>
            </li>
            <li>
              <NavLink to="/events" className="hover:underline">
                Events
              </NavLink>
            </li>
            <li>
              <NavLink to="/appointment" className="hover:underline">
                Appointment
              </NavLink>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Contact</h3>
          <p className="text-sm text-gray-200">Email: support@greengrow.com</p>
          <p className="text-sm text-gray-200">Phone: +94 71 234 5678</p>
          <p className="text-sm text-gray-200">Location: Colombo, Sri Lanka</p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-green-800 py-4 text-center text-sm text-gray-300">
        © {new Date().getFullYear()} Green Grow. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
