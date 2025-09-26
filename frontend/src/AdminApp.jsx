import { Routes, Route, Navigate } from "react-router-dom";
import AdminHome from "./admin/sidebar.jsx";
import AdminDashboard from "./admin/dashboard.jsx";
import UsersAdmin from "./admin/UsersAdmin.jsx";

// Replace with your real pages
const CoursesAdmin = () => <div>Courses page</div>;
const AppointmentsAdmin = () => <div>Appointments page</div>;
const CommunityAdmin = () => <div>Community page</div>;
const SettingsAdmin = () => <div>Settings page</div>;

export default function AdminApp() {
  return (
    <Routes>
      {/* Layout at /admin */}
      <Route path="/" element={<AdminHome />}>

        {/*Default page when visiting /admin */}
        <Route index element={<AdminDashboard />} />

        {/*admin pages */}
        <Route path="users" element={<UsersAdmin />} />
        <Route path="courses" element={<CoursesAdmin />} />
        <Route path="appointments" element={<AppointmentsAdmin />} />
        <Route path="community" element={<CommunityAdmin />} />
        <Route path="settings" element={<SettingsAdmin />} />

        {/*Catch-all fallback */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
