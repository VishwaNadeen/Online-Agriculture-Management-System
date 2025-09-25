import { Routes, Route } from "react-router-dom";

// public
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Home from "./pages/home";
import About from "./pages/about";

// Vishwa
import UserRegistration from "./pages/user/userRegistration";
import UserRoleDetails from "./pages/user/userRoleDetails";
import Login from "./pages/user/login";
import Profile from "./pages/user/profile";

// Methma
import Appointment from "./pages/appointment";

// Chanaka
import AddCourse from "./pages/addCourse";
import UpdateCourse from "./pages/updateCourse";
import CoursesAdmin from "./pages/courseAdmin";
import CoursesPage from "./pages/courses/coursePage";
import CourseOverview from "./pages/courses/courseOverview";

export default function ClientApp() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* public */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />

        {/* Vishwa */}
        <Route path="/signup" element={<UserRegistration />} />
        <Route path="/register-step2" element={<UserRoleDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />

        {/* Methma */}
        <Route path="/appointment" element={<Appointment />} />

        {/* Chanaka */}
        <Route path="/addcourse" element={<AddCourse />} />
        <Route path="/editcourse" element={<UpdateCourse />} />
        <Route path="/courseAdmin" element={<CoursesAdmin />} />
        <Route path="/coursepage" element={<CoursesPage />} />
        <Route path="/courses/:courseID" element={<CourseOverview />} />

      </Routes>
      <Footer />
    </>
  );
}
