import { Routes, Route, Navigate } from "react-router-dom";
import AdminHome from "./admin/sidebar.jsx";
import AdminDashboard from "./admin/dashboard.jsx";
import UsersAdmin from "./admin/usersAdmin.jsx";
import CoursesAdmin from "./admin/courseAdmin.jsx";
import AddCourse from "./admin/addCourse.jsx";
import UpdateCourse from "./admin/updateCourse.jsx";
import CommentsAdmin from "./admin/CommentsAdmin.jsx";
import EventAdmin from "./admin/EventAdmin.jsx";
import AddEvent from "./admin/AddEvent.jsx";
import EditEvent from "./admin/EditEvent.jsx";
import ConsultantAdmin from "./admin/consultantAdmin.jsx";
import DiscoveryAll from "./admin/discoveryAll";
import DiscoveryCreate from "./admin/DiscoveryCreate";
import DiscoveryEdit from "./admin/DiscoveryEdit";

// Replace with your real pages

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
        <Route path="courses" element={<CoursesAdmin></CoursesAdmin>} />
        <Route path="addCourse" element={<AddCourse></AddCourse>} />
        <Route path="updateCourse" element={<UpdateCourse></UpdateCourse>} />
        <Route path="appointments" element={<AppointmentsAdmin />} />
        <Route path="community" element={<CommunityAdmin />} />
        <Route path="settings" element={<SettingsAdmin />} />
        <Route path="comments" element={<CommentsAdmin />} />
        <Route path="event" element={<EventAdmin></EventAdmin>} />
        <Route path="consultant" element={<ConsultantAdmin></ConsultantAdmin>} />
        <Route path="addevent" element={<AddEvent></AddEvent>} />
        <Route path="event/:id/editevent" element={<EditEvent></EditEvent>} />
        <Route path="discoveries" element={<DiscoveryAll />} />
        <Route path="discoveries/new" element={<DiscoveryCreate />} />
        <Route path="discoveries/:idOrSlug/edit" element={<DiscoveryEdit />} />

        {/*Catch-all fallback */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
