import { Routes, Route, Navigate } from "react-router-dom";
import AdmingHome from "./admin/adminHome";

export default function AdminApp() {
  return (

    <Routes>
      
      <Route path="/adminHome" element={<AdmingHome />} />
      
    </Routes>
  );
}
