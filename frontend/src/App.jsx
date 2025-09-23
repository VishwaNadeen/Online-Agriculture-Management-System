import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

//public
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Home from "./pages/home";
import About from "./pages/about";

//Vishwa
import UserRegistration from "./pages/user/userRegistration";
import UserRoleDetails from "./pages/user/userRoleDetails";
import Login from "./pages/user/login";
import Profile from "./pages/user/profile"

//Methma
//import Appointment from "./pages/appointment";
import SearchCon from "./pages/SearchCon";
import CreateAppointment from "./pages/appointments/CreateAppointment";
import EditAppointment from "./pages/appointments/EditAppointment";
import ListAppointments from "./pages/appointments/ListAppointment";

//chanaka
import AddCourse from "./pages/addCourse";
import UpdateCourse from "./pages/updateCourse";
import CoursesAdmin from "./pages/courseAdmin";
import CoursesPage from "./pages/courses/coursePage";
import CourseOverview from "./pages/courses/courseOverview";

const App = () => {
 
  return (
    
    <Router>
      <Toaster position='top-right'/>
      <Navbar />
        <Routes>
          
          //public
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />

          //Vishwa
          <Route path="/signup" element={<UserRegistration />} />
          <Route path="/register-step2" element={<UserRoleDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />

          //Methma
          {/*<Route path="/appointment" element={<Appointment />} 
          <Route path="/searchcon" element={<SearchCon/>} />
          <Route path="/card" element={<ConsultantCard />} />*/}

          <Route path="/searchcon" element={<SearchCon/>} />
          <Route path="/appointment" element={<CreateAppointment />} />
          <Route path="/appointments" element={<ListAppointments />} />
          <Route path="/appointments/:id/edit" element={<EditAppointment />} />

          //chanaka
          <Route path="/addcourse" element={<AddCourse />} />
          <Route path="/editcourse" element={<UpdateCourse></UpdateCourse>} />
          <Route path="/courseAdmin" element={<CoursesAdmin></CoursesAdmin>} />
          <Route path="/coursepage" element={<CoursesPage></CoursesPage>} />
          <Route path="/courses/:courseID" element={<CourseOverview></CourseOverview>} />

        </Routes>
      <Footer />
    </Router>
  );
};

export default App;