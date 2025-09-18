import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Make sure these files export default components and the filenames match the casing:
import Appointment from "./components/appointment";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/appointment" element={<Appointment />} />
      </Routes>
    </Router>
  );
};

export default App;