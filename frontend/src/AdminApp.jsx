import { Routes, Route, Navigate } from "react-router-dom";

export default function AdminApp() {
  return (

    <Routes>
      
      <Route path="*" element={<Navigate to="." replace />} />
      
    </Routes>
  );
}
