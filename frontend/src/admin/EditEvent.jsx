// src/pages/Event/EditEvent.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { EventAPI } from "../api/events";
import toast from "react-hot-toast";
import AdminLoader from "../components/AdminLoader";

// Safely convert any date-like value to an <input type="date"> value (YYYY-MM-DD)
function dateToInput(val) {
  try {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    trainerName: "",
    date: "",
    time: "",
    duration: "",
    location: "",
    category: "Workshop",
    capacity: "",
    registrationDeadline: ""
  });

  const didFetchRef = useRef(false);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchEvent();
  }, [id, navigate]);

  const fetchEvent = async () => {
    try {
      if (!loading) setLoading(true);
      const event = await EventAPI.getById(id);
      
      // Format dates safely for input fields
      const eventDate = dateToInput(event?.date);
      const regDeadline = dateToInput(event?.registrationDeadline);
      
      setFormData({
        title: event.title || "",
        description: event.description || "",
        trainerName: event.trainerName || "",
        date: eventDate,
        time: event.time || "",
        duration: event.duration || "",
        location: event.location || "",
        category: event.category || "Workshop",
        capacity: event.capacity?.toString() || "",
        registrationDeadline: regDeadline
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details...');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const required = ['title', 'description', 'trainerName', 'date', 'time', 'location', 'capacity', 'registrationDeadline'];
    const missing = required.filter(field => !formData[field].toString().trim());
    
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(', ')}`);
      return false;
    }

    // Validate dates
    const eventDate = new Date(formData.date);
    const regDeadline = new Date(formData.registrationDeadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for date comparison
    
    if (regDeadline >= eventDate) {
      toast.error("Registration deadline must be before the event date");
      return false;
    }

    // Validate capacity
    const capacity = parseInt(formData.capacity);
    if (isNaN(capacity) || capacity <= 0) {
      toast.error("Capacity must be a positive number");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await EventAPI.update(id, {
        ...formData,
        capacity: parseInt(formData.capacity)
      });
      
      toast.success('Event updated successfully!');
      navigate(`/admin/event`);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error(error.response?.data?.message || 'Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <AdminLoader message="Loading event details..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link
              to={`/admin/event`}
              className="group p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
            >
              <svg className="w-6 h-6 text-gray-600 group-hover:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 bg-clip-text text-transparent">
                Edit Event
              </h1>
              <p className="text-lg text-gray-600 mt-2">Update event details and information</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Basic Information */}
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-emerald-50/50 to-emerald-100/30 rounded-xl p-6 border border-emerald-200/50">
                <h3 className="text-lg font-bold text-emerald-800 mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Basic Information
                </h3>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200/50 bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-300"
                      placeholder="Enter event title"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200/50 bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-300"
                      placeholder="Describe the event, what participants will learn, and any prerequisites"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      Trainer Name *
                    </label>
                    <input
                      type="text"
                      name="trainerName"
                      value={formData.trainerName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200/50 bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-300"
                      placeholder="Name of the trainer/speaker"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200/50 bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-300"
                    >
                      <option value="Workshop">Workshop</option>
                      <option value="Webinar">Webinar</option>
                      <option value="Field Visit">Field Visit</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div className="bg-gradient-to-r from-blue-50/50 to-blue-100/30 rounded-xl p-6 border border-blue-200/50">
              <h3 className="text-lg font-bold text-blue-800 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date & Time
              </h3>
              
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-blue-200/50 bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-blue-200/50 bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Duration (Optional)
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-blue-200/50 bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300"
                    placeholder="e.g., 2 hours, Half day"
                  />
                </div>
              </div>
            </div>

            {/* Location and Capacity */}
            <div className="bg-gradient-to-r from-purple-50/50 to-purple-100/30 rounded-xl p-6 border border-purple-200/50">
              <h3 className="text-lg font-bold text-purple-800 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location & Capacity
              </h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-purple-200/50 bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-300"
                    placeholder="Event venue or online platform"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-4 py-3 rounded-xl border-2 border-purple-200/50 bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-300"
                    placeholder="Maximum participants"
                  />
                </div>
              </div>
            </div>

            {/* Registration Deadline */}
            <div className="bg-gradient-to-r from-orange-50/50 to-orange-100/30 rounded-xl p-6 border border-orange-200/50">
              <h3 className="text-lg font-bold text-orange-800 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Registration Deadline
              </h3>
              
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  Registration Deadline *
                </label>
                <input
                  type="date"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  required
                  max={formData.date || undefined}
                  className="w-full px-4 py-3 rounded-xl border-2 border-orange-200/50 bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-orange-500/20 focus:border-orange-400 transition-all duration-300"
                />
                <p className="text-sm text-orange-700 mt-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Last date for participants to register (must be before event date)
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-8 border-t border-gray-200/50">
              <button
                type="submit"
                disabled={submitting}
                className="group relative flex-1 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="font-semibold">Updating Event...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold">Update Event</span>
                  </div>
                )}
              </button>
              
              <Link
                to={`/admin/event`}
                className="group relative px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-gray-500/20 text-center font-semibold"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancel</span>
                </div>
              </Link>
            </div>
          </form>
        </div>

        {/* Warning Note */}
        <div className="mt-8 bg-gradient-to-r from-amber-50/80 to-orange-50/80 backdrop-blur-sm border border-amber-200/50 rounded-2xl p-8 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Important Notes
              </h3>
              <ul className="text-amber-700 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Changes to event details will be visible to all registered participants</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Consider notifying participants about significant changes</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Reducing capacity may affect existing registrations</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Changing the date/time may require participant confirmation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEvent;
