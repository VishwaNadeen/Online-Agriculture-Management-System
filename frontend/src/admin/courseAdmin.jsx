// src/pages/Admin/CoursesAdmin.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BiEdit, BiPlus, BiTrash } from "react-icons/bi";
import { Link, useNavigate } from "react-router-dom";
import AdminLoader from "../components/AdminLoader";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function CoursesAdmin() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) {
      axios
        .get(`${BASE_URL}/courses`)
        .then((res) => {
          setCourses(res.data || []);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load courses", err);
          toast.error("Failed to load courses");
          setIsLoading(false);
        });
    }
  }, [isLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-6 sm:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 bg-clip-text text-transparent mb-3">
                Courses Management
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                Manage and organize all your courses, tutorials, and educational content.
              </p>
            </div>
          </div>
        </div>

        {/* Courses Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <AdminLoader message="Loading courses..." />
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-[1000px] w-full">
                <thead className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-200/50">
                  <tr className="text-left">
                    <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Course ID</th>
                    <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Name</th>
                    <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Category</th>
                    <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Level</th>
                    <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Language</th>
                    <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Thumbnail</th>
                    <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Videos</th>
                    <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">PDFs</th>
                    <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Texts</th>
                    <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Published</th>
                    <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Active</th>
                    <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {courses.map((course, index) => {
                    const {
                      courseID,
                      courseName,
                      altTitles, // unused (Alt Titles column removed)
                      category,
                      level,
                      language,
                      thumbnail,
                      videoTutorials = [],
                      pdfLessons = [],
                      textLessons = [],
                      isPublished,
                      isActive,
                    } = course || {};

                    return (
                      <tr
                        key={index}
                        className="group border-b border-emerald-100/50 hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-transparent transition-all duration-300"
                      >
                        <td className="p-4">
                          <div className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                            {courseID}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">
                            {courseName}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            {category}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-700">{level}</td>
                        <td className="p-4 text-sm text-gray-700 uppercase">{language}</td>
                        <td className="p-4">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt="thumb"
                              className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 border-2 border-white shadow-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
                            {videoTutorials.length}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-800 text-sm font-semibold">
                            {pdfLessons.length}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                            {textLessons.length}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              isPublished
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300/50"
                                : "bg-gray-100 text-gray-700 border border-gray-300/50"
                            }`}
                          >
                            {isPublished ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              isActive
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300/50"
                                : "bg-gray-100 text-gray-700 border border-gray-300/50"
                            }`}
                          >
                            {isActive ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                axios
                                  .delete(`${BASE_URL}/courses/${courseID}`)
                                  .then((res) => {
                                    console.log("Course deleted successfully");
                                    toast.success("Course deleted successfully");
                                    setIsLoading(true);
                                    navigate("/admin/courses");
                                  })
                                  .catch((error) => {
                                    console.error("Error deleting course:", error);
                                    toast.error("Failed to delete course");
                                  });
                              }}
                              className="group/btn relative p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-red-500/20"
                              title="Delete Course"
                            >
                              <BiTrash className="text-lg group-hover/btn:scale-110 transition-transform duration-200" />
                            </button>
                            <button
                              onClick={() => {
                                navigate("/admin/courseReport", {
                                  state: course, // pass whole object for prefill
                                });
                              }}
                              className="group/btn relative p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                              title="Edit Course"
                            >
                              <BiEdit className="text-lg group-hover/btn:scale-110 transition-transform duration-200" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {courses.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-600 mb-6">Get started by creating your first course.</p>
                  <Link
                    to="/admin/addCourse"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <BiPlus className="w-4 h-4 mr-2" />
                    Create Course
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed top-6 right-6 flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/CourseReport")}
          className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Reports</span>
          </div>
        </button>
        
        <Link
          to={"/admin/addCourse"}
          className="group relative px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
            <BiPlus className="text-xl" />
          </div>
          <span className="font-semibold hidden sm:block tracking-wide">Add Course</span>
        </Link>
      </div>
    </div>
  );
}
