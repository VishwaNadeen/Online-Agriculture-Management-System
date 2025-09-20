import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Make sure these files export default components and the filenames match the casing:
import Appointment from "./components/appointment";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Home from "./pages/home";
import About from "./pages/about";
import UserRegistration from "./pages/userRegistration.jsx";
import UserRoleDetails from "./pages/userRoleDetails";

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
      </Routes>

      <Footer />

    </Router>
  );
};

export default App;