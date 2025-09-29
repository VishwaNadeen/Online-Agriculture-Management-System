// src/pages/Admin/CoursesAdmin.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BiEdit, BiPlus, BiTrash } from "react-icons/bi";
import { Link, useNavigate } from "react-router-dom";
import Loader from "../components/loader";

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
    <div className="w-full min-h-screen bg-gray-100 relative">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-emerald-900 mb-4">
          Courses 
        </h1>

        <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
          {isLoading ? (
            <div className="p-10 flex justify-center bg-gray-100">
              <Loader></Loader>
            </div>
          ) : (
            <div className="overflow-auto">
              {/* table width kept reasonable */}
              <table className="min-w-[1000px] w-full">
                <thead className="bg-emerald-100/70 border-b border-emerald-200">
                  <tr className="text-left text-emerald-900">
                    <th className="p-3 text-sm font-semibold">Course ID</th>
                    <th className="p-3 text-sm font-semibold">Name</th>
                    {/* Alt Titles removed */}
                    <th className="p-3 text-sm font-semibold">Category</th>
                    <th className="p-3 text-sm font-semibold">Level</th>
                    <th className="p-3 text-sm font-semibold">Lang</th>
                    <th className="p-3 text-sm font-semibold">Thumbnail</th>
                    <th className="p-3 text-sm font-semibold">Videos</th>
                    <th className="p-3 text-sm font-semibold">PDFs</th>
                    {/* Texts added back */}
                    <th className="p-3 text-sm font-semibold">Texts</th>
                    <th className="p-3 text-sm font-semibold">Published</th>
                    <th className="p-3 text-sm font-semibold">Active</th>
                    <th className="p-3 text-sm font-semibold">Action</th>
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
                        className="border-b border-emerald-100 hover:bg-emerald-50/50 transition"
                      >
                        <td className="p-3 text-sm text-emerald-900">{courseID}</td>
                        <td className="p-3 text-sm text-emerald-900">{courseName}</td>
                        {/* Alt Titles cell removed */}
                        <td className="p-3 text-sm text-emerald-700">{category}</td>
                        <td className="p-3 text-sm text-emerald-700">{level}</td>
                        <td className="p-3 text-sm text-emerald-700 uppercase">{language}</td>
                        <td className="p-3">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt="thumb"
                              className="w-12 h-12 rounded-md object-cover border border-emerald-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-emerald-100 border border-emerald-200" />
                          )}
                        </td>
                        <td className="p-3 text-sm text-emerald-700 text-center">
                          {videoTutorials.length}
                        </td>
                        <td className="p-3 text-sm text-emerald-700 text-center">
                          {pdfLessons.length}
                        </td>
                        {/* Texts count cell added back */}
                        <td className="p-3 text-sm text-emerald-700 text-center">
                          {textLessons.length}
                        </td>
                        <td className="p-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              isPublished
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {String(isPublished)}
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {String(isActive)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <BiTrash
                              title="Delete"
                              className="bg-red-500 p-[7px] text-3xl rounded-full text-amber-50 cursor-pointer hover:bg-red-600"
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
                            />
                            <BiEdit
                              title="Edit"
                              className="bg-emerald-700 p-[7px] text-3xl rounded-full text-amber-50 cursor-pointer hover:bg-emerald-800"
                              onClick={() => {
                                navigate("/admin/updateCourse", {
                                  state: course, // pass whole object for prefill
                                });
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {courses.length === 0 && (
                <div className="p-8 text-center text-emerald-800">
                  No courses found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Button */}
    <Link
  to={"/admin/addCourse"}
  className="group fixed top-5 right-5 px-4 py-3 bg-gradient-to-r bg-emerald-700 text-white rounded-[10px] border border-emerald-600/50 shadow-lg shadow-emerald-700/20 hover:shadow-xl hover:shadow-emerald-700/30 transition transform duration-200 hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300/70 flex items-center gap-2"
>
  <BiPlus className="text-2xl transition-transform duration-200 group-hover:rotate-60" />
  <span className="font-medium hidden sm:block tracking-wide">Add Course</span>
</Link>

    </div>
  );
}
