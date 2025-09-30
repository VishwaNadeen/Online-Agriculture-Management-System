// src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { BookOpen, Users, Calendar, TrendingUp, Award, Sprout } from "lucide-react";

/** Files live in /public/images/ */
const BG_IMAGES = ["/images/home1.jpg", "/images/home2.png", "/images/home3.jpg"];

const SLIDE_MS = 6000;
const FADE_MS = 900;

const Home = () => {
  const images = useMemo(() => BG_IMAGES.filter(Boolean), []);
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Preload
  useEffect(() => {
    images.forEach((src) => {
      const i = new Image();
      i.src = src;
    });
    // Trigger animations after mount
    setTimeout(() => setLoaded(true), 100);
  }, [images]);

  // Auto-advance
  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setActive((i) => (i + 1) % images.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-green-50 to-gray-50 overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative w-full min-h-[75vh] overflow-hidden">
        {/* Background slideshow */}
        <div className="absolute inset-0 z-0">
          {images.map((src, idx) => (
            <div
              key={src + idx}
              className="absolute inset-0 bg-center bg-cover"
              style={{
                backgroundImage: `url(${src})`,
                opacity: idx === active ? 1 : 0,
                transform: idx === active ? "scale(1.05)" : "scale(1.1)",
                transition: `opacity ${FADE_MS}ms ease-in-out, transform ${SLIDE_MS}ms ease`,
              }}
            />
          ))}
          {/* Overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-green-800/30 to-green-700/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-green-50 via-transparent to-transparent" />
        </div>

        {/* Foreground content */}
        <div className="relative z-10 flex items-center justify-center min-h-[75vh] px-6">
          <div
            className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50/95 backdrop-blur-sm rounded-full shadow-lg mb-6">
              <Sprout className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-700">
                Agricultural Excellence Platform
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-2xl mb-6">
              Welcome to <span className="text-green-600">Green Grow</span>
            </h1>

            <p className="text-lg md:text-xl text-white/95 max-w-3xl mx-auto mb-10 drop-shadow-lg leading-relaxed">
              Your comprehensive platform for agricultural learning, community collaboration, and
              expert consultation. Empowering farmers and consultants to grow smarter together.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <NavLink
                to="/tutorials"
                className="group relative px-8 py-4 bg-green-600 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Get Started
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </NavLink>

              <NavLink
                to="/about"
                className="group px-8 py-4 bg-white/95 backdrop-blur-sm text-green-700 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-white/50"
              >
                <span className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  Learn More
                </span>
              </NavLink>
            </div>
          </div>
        </div>

        {/* Slide indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActive(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === active ? "w-8 bg-white shadow-lg" : "w-2 bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* FEATURES SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div
          className={`text-center mb-16 transition-all duration-1000 delay-300 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to <span className="text-green-600">Thrive</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive tools and resources designed to support every step of your agricultural
            journey
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: BookOpen,
              title: "Tutorials & Learning",
              desc:
                "Access curated lessons, videos, and comprehensive guides to boost your agricultural knowledge and skills.",
              color: "green",
              delay: "delay-[400ms]",
              to: "/coursepage", // 1st → /coursepage
            },
            {
              icon: Users,
              title: "Community Forum",
              desc:
                "Connect with fellow farmers and consultants. Share ideas, ask questions, and grow together as a community.",
              color: "emerald",
              delay: "delay-[500ms]",
              to: "/community", // 2nd → /community
            },
            {
              icon: Calendar,
              title: "Expert Appointments",
              desc:
                "Book one-on-one consultations with agricultural experts for personalized guidance and tailored solutions.",
              color: "teal",
              delay: "delay-[600ms]",
              to: "/SearchCon", // 3rd → /SearchCon
            },
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <NavLink
                key={idx}
                to={feature.to}
                className={`group relative p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 cursor-pointer ${
                  loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                } ${feature.delay}`}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-t-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-${feature.color}-50 to-${feature.color}-100 mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`w-7 h-7 text-${feature.color}-600`} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors duration-300">
                  {feature.title}
                </h3>

                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>

                <div className="mt-6 flex items-center text-green-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Explore{" "}
                  <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">
                    →
                  </span>
                </div>
              </NavLink>
            );
          })}
        </div>
      </section>

      {/* STATS SECTION (updated: removed green background) */}
      <section
        className={`py-16 transition-all duration-1000 delay-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Active Users", value: "10K+", icon: Users },
              { label: "Expert Consultants", value: "500+", icon: Award },
              { label: "Learning Resources", value: "1000+", icon: BookOpen },
              { label: "Success Stories", value: "5K+", icon: TrendingUp },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="group">
                  <Icon className="w-8 h-8 text-green-600 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 text-sm">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section
        className={`max-w-4xl mx-auto px-6 py-20 text-center transition-all duration-1000 delay-800 ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Ready to Transform Your Agricultural Journey?
        </h2>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          Join thousands of farmers and consultants who are already growing smarter with Green Grow
        </p>
        <NavLink
          to="/signup"
          className="inline-flex items-center gap-2 px-10 py-4 bg-green-600 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl hover:bg-green-700 transition-all duration-300 hover:scale-105"
        >
          Join Green Grow Today
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </NavLink>
      </section>
    </div>
  );
};

export default Home;
