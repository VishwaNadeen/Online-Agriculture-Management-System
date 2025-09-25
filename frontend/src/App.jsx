import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import ClientApp from "./ClientApp";
import AdminApp from "./AdminApp"

const App = () => {
  
  return (
    
    <Router>
      <Toaster position='top-right'/>
        <Routes>
          <Route path="/*" element={<ClientApp />} />
          <Route path="/admin" element={<AdminApp />} />
        </Routes>
    </Router>
  );
};

export default App;