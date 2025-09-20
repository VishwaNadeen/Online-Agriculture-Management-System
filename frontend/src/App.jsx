import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Make sure these files export default components and the filenames match the casing:
import Appointment from "./pages/appointment.jsx";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Home from "./pages/home";
import About from "./pages/about";
import UserRegistration from "./pages/userRegistration.jsx";
import UserRoleDetails from "./pages/userRoleDetails";
import AddCourse from "./pages/addCourse.jsx";


const App = () => {
 
  return (
    
    <Router>
      
    <Navbar />
    
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/about" element={<About />} />
        <Route path="/signup" element={<UserRegistration />} />
        <Route path="/register-step2" element={<UserRoleDetails />} />
        <Route path="/course" element={<AddCourse></AddCourse>} />
        
      </Routes>

    <Footer />

    </Router>

  );
};

export default App;