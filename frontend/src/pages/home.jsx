// src/pages/Home.jsx
import React from "react";
import { NavLink } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-green-700">
          Welcome to Green Grow 🌱
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl">
          Your one-stop platform for agricultural learning, community
          collaboration, and expert consultation.  
          Empowering farmers and consultants to grow smarter together.
        </p>
        <div className="mt-8 flex gap-4">
          <NavLink
            to="/tutorials"
            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          >
            Get Started
          </NavLink>
          <NavLink
            to="/about"
            className="px-6 py-3 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition"
          >
            Learn More
          </NavLink>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold text-green-700">
            Tutorials & Learning
          </h3>
          <p className="mt-2 text-gray-600 text-sm">
            Access curated lessons, videos, and guides to boost your agricultural
            knowledge.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold text-green-700">
            Community Forum
          </h3>
          <p className="mt-2 text-gray-600 text-sm">
            Connect with other farmers and consultants. Share ideas, ask
            questions, and grow together.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold text-green-700">
            Expert Appointments
          </h3>
          <p className="mt-2 text-gray-600 text-sm">
            Book consultations with agricultural experts for personalized
            guidance and solutions.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
