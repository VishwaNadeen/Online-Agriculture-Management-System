// src/components/Footer.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { Mail, Phone, MapPin, Leaf, Facebook, Twitter, Instagram, Linkedin, ArrowRight } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-green-800 via-green-700 to-green-800 text-white mt-0">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand & About */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <Leaf className="w-8 h-8 text-green-300" />
                <div className="absolute inset-0 bg-green-400 opacity-30 blur-lg" />
              </div>
              <h2 className="text-2xl font-bold">Green Grow</h2>
            </div>
            <p className="text-sm text-green-100 leading-relaxed mb-6">
              Your trusted partner in agriculture management. Learn, connect, and grow with us towards sustainable farming.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {[
                { icon: Facebook, href: "#", label: "Facebook" },
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Linkedin, href: "#", label: "LinkedIn" }
              ].map((social, idx) => {
                const Icon = social.icon;
                return (
                  <a
                    key={idx}
                    href={social.href}
                    aria-label={social.label}
                    className="group p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-110"
                  >
                    <Icon className="w-5 h-5 text-green-100 group-hover:text-white transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 relative inline-block">
              Quick Links
              <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-green-400 rounded-full" />
            </h3>
            <ul className="space-y-3">
              {[
                { to: "/", label: "Home" },
                { to: "/about", label: "About Us" },
                { to: "/coursepage", label: "Tutorials" },
                { to: "/community", label: "Community" },
                { to: "/events", label: "Events" },
                { to: "/SearchCon", label: "Consultant" }
              ].map((link, idx) => (
                <li key={idx}>
                  <NavLink
                    to={link.to}
                    className="group flex items-center gap-2 text-sm text-green-100 hover:text-white transition-all duration-300 hover:translate-x-1"
                  >
                    <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    <span>{link.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4 relative inline-block">
              Resources
              <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-green-400 rounded-full" />
            </h3>
            <ul className="space-y-3">
              {[
                { to: "#", label: "Blog" },
                { to: "#", label: "Help Center" },
                { to: "#", label: "Privacy Policy" },
                { to: "#", label: "Terms of Service" },
                { to: "#", label: "FAQs" },
                { to: "#", label: "Contact Support" }
              ].map((link, idx) => (
                <li key={idx}>
                  <NavLink
                    to={link.to}
                    className="group flex items-center gap-2 text-sm text-green-100 hover:text-white transition-all duration-300 hover:translate-x-1"
                  >
                    <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    <span>{link.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 relative inline-block">
              Get in Touch
              <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-green-400 rounded-full" />
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <Mail className="w-5 h-5 text-green-300 mt-0.5 group-hover:scale-110 transition-transform" />
                <a
                  href="mailto:support@greengrow.com"
                  className="text-sm text-green-100 hover:text-white transition-colors"
                >
                  support@greengrow.com
                </a>
              </li>
              <li className="flex items-start gap-3 group">
                <Phone className="w-5 h-5 text-green-300 mt-0.5 group-hover:scale-110 transition-transform" />
                <a
                  href="tel:+94712345678"
                  className="text-sm text-green-100 hover:text-white transition-colors"
                >
                  +94 71 234 5678
                </a>
              </li>
              <li className="flex items-start gap-3 group">
                <MapPin className="w-5 h-5 text-green-300 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm text-green-100">
                  Colombo, Sri Lanka
                </span>
              </li>
            </ul>

            {/* Newsletter Signup */}
            <div className="mt-6">
              <p className="text-sm text-green-100 mb-3">Subscribe to our newsletter</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-green-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                />
                <button className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors duration-300 hover:shadow-lg">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
      </div>

      {/* Bottom Bar */}
      <div className="bg-green-900/50 backdrop-blur-sm py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-green-200">
            <p>
              © {currentYear} <span className="font-semibold text-white">Green Grow</span>. All rights reserved.
            </p>
            <div className="flex gap-6">
              <NavLink to="#" className="hover:text-white transition-colors duration-300">
                Privacy Policy
              </NavLink>
              <NavLink to="#" className="hover:text-white transition-colors duration-300">
                Terms of Service
              </NavLink>
              <NavLink to="#" className="hover:text-white transition-colors duration-300">
                Cookie Policy
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;