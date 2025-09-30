import { Routes, Route } from "react-router-dom";

// public
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Home from "./pages/home";
import About from "./pages/about";

// Vishwa
import UserRegistration from "./pages/user/userRegistration";
import FarmRegistration from "./pages/user/farmRegistration.jsx";
import ConsultantRegistration from "./pages/user/consultantRegistration.jsx";
import Login from "./pages/user/login";
import Profile from "./pages/user/profile";
import Farm from "./pages/user/farmerDetailsPage.jsx";
import ProfileEdit from "./pages/user/profileEdit.jsx";
import FarmEdit from "./pages/user/farmEdit.jsx";
import Consultant from "./pages/user/ConsultantDetailsPage.jsx";
import ConsultantEdit from "./pages/user/consultantedit.jsx";

// Methma
import Searchcon from "./pages/appointments/SearchCon";
import CreateAppointment from "./pages/appointments/CreateAppointment.jsx";
import EditAppointment from "./pages/appointments/EditAppointment.jsx";
import ListAppointment from "./pages/appointments/ListAppointment.jsx";
import Dashboard from "./pages/dashboard/Dashboard";
import MyAppointments from "./pages/appointments/MyAppointments";

//kalana
import CommunityForum from "./pages/community/CommunityForum";
import MyPosts from "./pages/community/MyPosts.jsx";

// Chanaka
import CoursesPage from "./pages/courses/coursePage";
import CourseOverview from "./pages/courses/courseOverview";

//dilhani
import EventPage from "./pages/event/EventsPage.jsx";
import EventDetail from "./pages/event/EventDetail.jsx";
import MyEvents from "./pages/event/MyEvents.jsx";

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
        <Route path="/register/farmer" element={<FarmRegistration />} />
        <Route path="/register/consultant" element={<ConsultantRegistration />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/farm" element={<Farm />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/farm/edit" element={<FarmEdit />} />
        <Route path="/profile/consultant" element={<Consultant />} />
        <Route path="/profile/consultant/edit" element={<ConsultantEdit />} />

        {/* Methma */}
        <Route path="/SearchCon" element={<Searchcon />} />
        <Route path="/appointment" element={<CreateAppointment />} />
        <Route path="/appointment/:id/edit" element={<EditAppointment />} />
      
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/consultant" element={<Dashboard />} />
        <Route path="/dashboard/bookings" element={<Dashboard />} />
       {/* <Route path="/appointments/me" element={<MyAppointments />} />
         <Route path="/my-appointments" element={<ListAppointment />} />*/}
         <Route path="/my-appointments" element={<MyAppointments />} />

        {/* kalana */}
        <Route path="/community" element={<CommunityForum />} />
        <Route path="mine" element={<MyPosts />} />
        

        {/* Chanaka */}
        <Route path="/coursepage" element={<CoursesPage />} />
        <Route path="/courses/:courseID" element={<CourseOverview />} />

        {/* dilhani */}
        <Route path="/events" element={<EventPage />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/my-events" element={<MyEvents />} />

      </Routes>
      <Footer />
    </>
  );
}
