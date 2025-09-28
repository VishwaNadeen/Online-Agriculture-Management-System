// src/pages/Event/MyEvents.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { Link, useNavigate } from "react-router-dom";
import { EventRegistrationAPI } from "../../api/events";
import toast from "react-hot-toast";

// Helper function to read auth from storage
function readAuthFromStorage() {
  const get = (k) => localStorage.getItem(k) ?? sessionStorage.getItem(k);
  const token = get("auth_token") || get("token") || get("user_token") || get("authToken") || "";
  let user = null;
  const rawUser = get("auth_user");
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      user = null;
    }
  }
  return { token, user };
}

const EventRegistrationCard = ({ registration, onCancel, onUpdate }) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState({
    contactInfo: registration.contactInfo || "",
    specialNotes: registration.specialNotes || ""
  });
  const [updating, setUpdating] = useState(false);

  // Normalize event data — could be populated object or just an ID string
  const event = useMemo(() => {
    return (registration && typeof registration.eventId === 'object') ? registration.eventId : null;
  }, [registration]);
  const isEventPopulated = !!(event && event.title);
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isEventPast = () => {
    if (!isEventPopulated) return false; // Can't determine if not populated
    return new Date() > new Date(event.date);
  };

  const canCancel = () => {
    if (!isEventPopulated) return true; // Allow cancellation if we can't determine
    if (isEventPast()) return false;
    // Allow cancellation up to 24 hours before event
    const eventDateTime = new Date(`${event.date}T${event.time || '00:00'}`);
    const oneDayBefore = new Date(eventDateTime.getTime() - (24 * 60 * 60 * 1000));
    return new Date() < oneDayBefore;
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const handleCancel = () => setConfirmOpen(true);
  const confirmCancel = async () => {
    setConfirmOpen(false);
    onCancel(registration._id);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await EventRegistrationAPI.update(registration._id, editData);
      toast.success('Registration updated successfully');
      setShowEditForm(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating registration:', error);
      toast.error('Failed to update registration');
    } finally {
      setUpdating(false);
    }
  };

  // Don't hide the registration even if event is not populated

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 overflow-hidden">
      <ConfirmModal
        open={confirmOpen}
        title="Cancel registration?"
        message={isEventPopulated ? `You are about to cancel your registration for "${event.title}".` : 'You are about to cancel this registration.'}
        confirmText="Cancel Registration"
        cancelText="Keep"
        danger
        onConfirm={confirmCancel}
        onCancel={() => setConfirmOpen(false)}
      />
      <div className="p-6">
        {/* Event Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              (event?.category === 'Workshop') ? 'bg-blue-100 text-blue-800' :
              (event?.category === 'Webinar') ? 'bg-purple-100 text-purple-800' :
              'bg-emerald-100 text-emerald-800'
            }`}>
              {event?.category || 'Unknown'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isEventPast() ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
            }`}>
              {isEventPast() ? 'Completed' : 'Upcoming'}
            </span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Edit Registration"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleCancel}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cancel Registration"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Event Details */}
        {isEventPopulated ? (
          <Link to={`/events/${event._id}`} className="block group">
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
              {event.title}
            </h3>
            
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(event.date)} at {event.time}</span>
              </div>

              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{event.location}</span>
              </div>

              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>By {event.trainerName}</span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="block">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Event Details Not Available
            </h3>
            <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 mb-4">
              <p className="text-orange-800 text-sm">
                <strong>Event ID:</strong> {typeof registration.eventId === 'string' ? registration.eventId : 'Unknown'}
              </p>
              <p className="text-orange-700 text-sm mt-1">
                Event details couldn't be loaded. This might be a database issue.
              </p>
            </div>
          </div>
        )}

        {/* Registration Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Registration Details</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div><span className="font-medium">Contact:</span> {registration.contactInfo}</div>
            <div><span className="font-medium">Registered:</span> {formatDate(registration.createdAt)}</div>
            {registration.specialNotes && (
              <div><span className="font-medium">Notes:</span> {registration.specialNotes}</div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {showEditForm && !isEventPast() && (
          <form onSubmit={handleUpdate} className="border-t pt-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Contact Information
              </label>
              <input
                type="text"
                value={editData.contactInfo}
                onChange={(e) => setEditData(prev => ({ ...prev, contactInfo: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Phone number or email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Special Notes
              </label>
              <textarea
                value={editData.specialNotes}
                onChange={(e) => setEditData(prev => ({ ...prev, specialNotes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Any special requirements..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update'}
              </button>
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Cancellation Notice */}
        {!isEventPast() && !canCancel() && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Cancellation is no longer available (within 24 hours of event)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MyEvents = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true); // first-load only
  const [filter, setFilter] = useState('all'); // all, upcoming, past
  const [user, setUser] = useState(() => readAuthFromStorage().user);
  const navigate = useNavigate();

  // Keep auth in sync without causing re-render storms
  useEffect(() => {
    const handleAuthChange = () => {
      const data = readAuthFromStorage();
      setUser(data.user || null);
    };
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('auth-changed', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, []);

  // Derive a stable userId
  const userId = useMemo(() => (user?._id || user?.id || null), [user?._id, user?.id]);

  // Redirect when not logged in (after initial check)
  useEffect(() => {
    if (user === null) {
      toast.error('Please login to view your events');
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchMyRegistrations = useCallback(async () => {
    if (!userId) return; // guard
    try {
      const regs = await EventRegistrationAPI.getByFarmerId(userId);
      setRegistrations(regs || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load your events');
    } finally {
      setLoading(false); // stop skeleton after first fetch attempt
    }
  }, [userId]);

  // StrictMode-safe fetch: run once when userId ready
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (!userId) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchMyRegistrations();
  }, [userId, fetchMyRegistrations]);

  const handleCancelRegistration = async (registrationId) => {
    try {
      await EventRegistrationAPI.delete(registrationId);
      toast.success('Registration cancelled successfully');
      fetchMyRegistrations(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling registration:', error);
      toast.error('Failed to cancel registration');
    }
  };

  const filteredRegistrations = useMemo(() => registrations.filter(registration => {
    console.log('Filtering registration:', registration);
    
    if (!registration.eventId) {
      console.log('Registration missing eventId:', registration);
      // For now, still include these to debug the issue
      return filter === 'all'; // Only show in 'all' filter to debug
    }
    
    // If eventId exists but is not populated (just an ID string)
    if (typeof registration.eventId === 'string') {
      console.log('EventId not populated, just ID string:', registration.eventId);
      return filter === 'all'; // Show in 'all' for debugging
    }
    
    const eventDate = new Date(registration.eventId.date);
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return eventDate > now;
      case 'past':
        return eventDate <= now;
      default:
        return true;
    }
  }), [registrations, filter]);

  const upcomingCount = registrations.filter(r => r.eventId && new Date(r.eventId.date) > new Date()).length;
  const pastCount = registrations.filter(r => r.eventId && new Date(r.eventId.date) <= new Date()).length;

  if (user === null) return null; // waiting for redirect

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-emerald-700 mb-2">
              My Events 📅
            </h1>
            <p className="text-lg text-gray-600">
              Manage your event registrations and track your agricultural learning journey
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/events"
              className="inline-flex items-center px-5 py-2.5 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Events
            </Link>
            <Link
              to="/coursepage"
              className="inline-flex items-center px-5 py-2.5 bg-white text-emerald-600 border border-emerald-600 rounded-lg shadow hover:bg-emerald-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Explore Courses
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-6 sm:grid-cols-3 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              {registrations.length}
            </div>
            <div className="text-gray-600">Total Registered</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {upcomingCount}
            </div>
            <div className="text-gray-600">Upcoming Events</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="text-3xl font-bold text-gray-600 mb-2">
              {pastCount}
            </div>
            <div className="text-gray-600">Completed Events</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {[
              { value: 'all', label: 'All Events', count: registrations.length },
              { value: 'upcoming', label: 'Upcoming', count: upcomingCount },
              { value: 'past', label: 'Past', count: pastCount }
            ].map(({ value, label, count }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === value
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-emerald-50 border border-gray-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* (debug panel removed) */}

        {/* Events List */}
        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {filter === 'all' ? 'No Events Registered' : 
               filter === 'upcoming' ? 'No Upcoming Events' : 
               'No Past Events'}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? "You haven't registered for any events yet. Explore available events to start learning!"
                : filter === 'upcoming'
                ? "No upcoming events in your schedule. Check out new events to register for."
                : "No completed events to show."}
            </p>
            {registrations.length > 0 && filteredRegistrations.length === 0 && (
              <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded text-orange-800">
                <p>Found {registrations.length} registrations but they don't have event details.</p>
                <p>This might be a data population issue.</p>
              </div>
            )}
            {/* Removed Explore button from empty state; actions available in header */}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredRegistrations.map((registration) => (
              <EventRegistrationCard
                key={registration._id}
                registration={registration}
                onCancel={handleCancelRegistration}
                onUpdate={fetchMyRegistrations}
              />
            ))}
          </div>
        )}

        {/* Quick Actions moved to header */}
      </div>
    </div>
  );
};

export default MyEvents;