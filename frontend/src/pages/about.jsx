// src/pages/About.jsx
import React from "react";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-green-700">
          About Green Grow 🌱
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Green Grow is an innovative platform designed to empower farmers,
          consultants, and agricultural enthusiasts with the tools, resources,
          and community they need to thrive.
        </p>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-7xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-2">
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <h2 className="text-2xl font-semibold text-green-700 mb-2">
            Our Mission
          </h2>
          <p className="text-gray-600">
            To connect farmers with knowledge, technology, and experts — helping
            them increase productivity, adopt sustainable practices, and grow
            stronger communities.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <h2 className="text-2xl font-semibold text-green-700 mb-2">
            Our Vision
          </h2>
          <p className="text-gray-600">
            To become the leading digital agriculture hub in Sri Lanka and
            beyond, where innovation meets tradition, and growth benefits
            everyone.
          </p>
        </div>
      </section>

      {/* Team Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-green-700 mb-8">Our Team</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Member 1 */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <img
              src="https://via.placeholder.com/150"
              alt="Team Member"
              className="w-24 h-24 rounded-full mx-auto border-2 border-green-500"
            />
            <h3 className="mt-4 text-lg font-semibold text-green-700">
              Vishwa Nadeen
            </h3>
            <p className="text-gray-500 text-sm">Founder & Developer</p>
          </div>

          {/* Member 2 */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <img
              src="https://via.placeholder.com/150"
              alt="Team Member"
              className="w-24 h-24 rounded-full mx-auto border-2 border-green-500"
            />
            <h3 className="mt-4 text-lg font-semibold text-green-700">
              Consultant A
            </h3>
            <p className="text-gray-500 text-sm">Agriculture Consultant</p>
          </div>

          {/* Member 3 */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <img
              src="https://via.placeholder.com/150"
              alt="Team Member"
              className="w-24 h-24 rounded-full mx-auto border-2 border-green-500"
            />
            <h3 className="mt-4 text-lg font-semibold text-green-700">
              Developer B
            </h3>
            <p className="text-gray-500 text-sm">Full Stack Developer</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
