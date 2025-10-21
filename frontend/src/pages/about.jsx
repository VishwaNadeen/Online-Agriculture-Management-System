// src/pages/About.jsx
import React, { useState, useEffect } from "react";
import { Sprout, Users, BookOpen, TrendingUp, Target, Eye, Heart, Award, Zap, Shield } from "lucide-react";

const About = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-10/40 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-green-50/50 pt-20 pb-16">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-200 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-300 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />
        
        <div className={`relative max-w-5xl mx-auto px-6 text-center transition-all duration-1000 ${
          loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full mb-6">
            <Sprout className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-700">Our Story</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            About <span className="text-green-600">Green Grow</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Green Grow is an innovative platform designed to empower farmers, consultants, and agricultural 
            enthusiasts with the tools, resources, and community they need to thrive in modern agriculture.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid gap-8 md:grid-cols-2">
          <div className={`group relative p-8 bg-gradient-to-br from-white to-green-100/40 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-green-100 overflow-hidden ${
            loaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
          }`}
          style={{ transitionDelay: '200ms' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl mb-6 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-7 h-7 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors duration-300">
                Our Mission
              </h2>
              
              <p className="text-gray-600 leading-relaxed">
                To connect farmers with knowledge, technology, and experts — helping them increase productivity, 
                adopt sustainable practices, and grow stronger communities that benefit everyone.
              </p>
              
              <div className="mt-6 flex items-center text-green-600 font-semibold text-sm">
                <span className="h-px w-12 bg-green-600 mr-3" />
                Empowering Growth
              </div>
            </div>
          </div>

          <div className={`group relative p-8 bg-gradient-to-br from-white to-green-50/50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-green-100 overflow-hidden ${
            loaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}
          style={{ transitionDelay: '300ms' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl mb-6 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                <Eye className="w-7 h-7 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors duration-300">
                Our Vision
              </h2>
              
              <p className="text-gray-600 leading-relaxed">
                To become the leading digital agriculture hub in Sri Lanka and beyond, where innovation meets tradition, 
                and growth benefits everyone in the agricultural ecosystem.
              </p>
              
              <div className="mt-6 flex items-center text-green-600 font-semibold text-sm">
                <span className="h-px w-12 bg-green-600 mr-3" />
                Leading Innovation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="relative bg-gradient-to-b from-white via-green-100/40 to-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className={`text-center mb-16 transition-all duration-1000 delay-400 ${
            loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What We <span className="text-green-600">Offer</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Comprehensive solutions designed to support every aspect of your agricultural journey
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Sprout,
                title: "Sustainable Farming",
                desc: "Guidance on eco-friendly methods to ensure healthier crops and a better future for generations.",
                color: "from-green-500 to-emerald-600",
                delay: "delay-[500ms]"
              },
              {
                icon: Users,
                title: "Community Support",
                desc: "A growing network of farmers, consultants, and experts to share knowledge and solutions.",
                color: "from-emerald-500 to-teal-600",
                delay: "delay-[600ms]"
              },
              {
                icon: BookOpen,
                title: "Learning Resources",
                desc: "Access to tutorials, guides, and expert content tailored for all levels of experience.",
                color: "from-teal-500 to-cyan-600",
                delay: "delay-[700ms]"
              },
              {
                icon: TrendingUp,
                title: "Growth & Innovation",
                desc: "Leveraging technology to improve yield, efficiency, and long-lasting agricultural success.",
                color: "from-cyan-500 to-blue-600",
                delay: "delay-[800ms]"
              }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className={`group relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-100 overflow-hidden ${
                    loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  } ${feature.delay}`}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-t-2xl" />
                  
                  <div className={`relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                  
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center text-green-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Learn More <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="max-w-7xl mx-auto px-6 py-20 bg-gradient-to-b from-white via-green-100/40 to-white">
        <div className={`text-center mb-16 transition-all duration-1000 delay-[900ms] ${
          loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Core <span className="text-green-600">Values</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            The principles that guide everything we do at Green Grow
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Heart,
              title: "Sustainability",
              desc: "Committed to eco-friendly practices that protect our planet"
            },
            {
              icon: Shield,
              title: "Trust & Integrity",
              desc: "Building lasting relationships through transparency and honesty"
            },
            {
              icon: Zap,
              title: "Innovation",
              desc: "Embracing technology to drive agricultural advancement"
            },
            {
              icon: Users,
              title: "Community First",
              desc: "Putting farmers and their needs at the center of everything"
            },
            {
              icon: Award,
              title: "Excellence",
              desc: "Striving for the highest quality in our services and support"
            },
            {
              icon: TrendingUp,
              title: "Continuous Growth",
              desc: "Always learning and evolving to serve you better"
            }
          ].map((value, idx) => {
            const Icon = value.icon;
            return (
              <div
                key={idx}
                className={`group flex items-start gap-4 p-6 bg-white rounded-xl shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 ${
                  loaded ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ transitionDelay: `${1000 + idx * 100}ms` }}
              >
                <div className="shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors duration-300">
                  <Icon className="w-6 h-6 text-green-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-green-600 transition-colors duration-300">
                    {value.title}
                  </h3>
                  <p className="text-sm text-gray-600">{value.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default About;