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
import Searchcon from "./pages/appointments/SearchCon";
import CreateAppointment from "./pages/appointments/CreateAppointment.jsx";
import EditAppointment from "./pages/appointments/EditAppointment.jsx";
import ListAppointment from "./pages/appointments/ListAppointment.jsx";
import Dashboard from "./pages/dashboard/Dashboard";
import MyAppointments from "./pages/appointments/MyAppointments";

//kalana
import CommunityForum from "./pages/community/CommunityForum";

// Chanaka

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
        <Route path="/SearchCon" element={<Searchcon />} />
        <Route path="/appointment" element={<CreateAppointment />} />
        <Route path="/appointment/:id/edit" element={<EditAppointment />} />
        <Route path="/my-appointments" element={<ListAppointment />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/consultant" element={<Dashboard />} />
        <Route path="/dashboard/bookings" element={<Dashboard />} />
        <Route path="/appointments/me" element={<MyAppointments />} />

        {/* kalana */}
        <Route path="/community" element={<CommunityForum />} />

        {/* Chanaka */}
        
        <Route path="/coursepage" element={<CoursesPage />} />
        <Route path="/courses/:courseID" element={<CourseOverview />} />

      </Routes>
      <Footer />
    </>
  );
}
