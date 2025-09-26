// src/pages/admin/AdminDashboard.jsx
export default function AdminDashboard() {
  return (
    <div className="space-y-6 ">
      <h1 className="text-3xl font-bold text-green-700">Welcome, Admin!</h1>
      <p className="text-gray-700">
        This is your main dashboard. From here you can manage users, tutorials,
        appointments, community posts, and system settings.
      </p>

      {/* Example quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-semibold text-green-700">128</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Tutorials</p>
          <p className="text-2xl font-semibold text-green-700">34</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Appointments</p>
          <p className="text-2xl font-semibold text-green-700">12</p>
        </div>
      </div>
    </div>
  );
}
