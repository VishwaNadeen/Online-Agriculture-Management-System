import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

//public
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Home from "./pages/home";
import About from "./pages/about";

//Vishwa
import UserRegistration from "./pages/userRegistration";
import UserRoleDetails from "./pages/userRoleDetails";
import Login from "./pages/logIn";

//Methma
import Appointment from "./pages/appointment";

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

          //Methma
          <Route path="/appointment" element={<Appointment />} />

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