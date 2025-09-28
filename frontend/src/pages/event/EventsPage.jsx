// src/pages/Event/EventsPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { Link, useNavigate } from "react-router-dom";
import { EventAPI } from "../../api/events";
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


//delivery term


const CategoryBadge = ({ category }) => {
  const categoryColors = {
    'Workshop': 'bg-blue-100 text-blue-800 border-blue-200',
    'Webinar': 'bg-purple-100 text-purple-800 border-purple-200',
    'Field Visit': 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${categoryColors[category] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
      {category}
    </span>
  );
};

const EventCard = React.memo(({ event, isAdmin, onEdit, onDelete }) => {
  const navigate = useNavigate();
  
  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const isRegistrationOpen = useMemo(() => {
    return new Date() <= new Date(event.registrationDeadline);
  }, [event.registrationDeadline]);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const handleDelete = (e) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };
  const confirmDelete = () => {
    setConfirmOpen(false);
    onDelete(event._id);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(event._id);
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group border border-emerald-100"
      onClick={() => navigate(`/events/${event._id}`)}
    >
      <ConfirmModal
        open={confirmOpen}
        title="Delete event?"
        message={`This will permanently delete "${event.title}".`}
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
      {/* Header with category and admin actions */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          <CategoryBadge category={event.category} />
          {isAdmin && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={handleEdit}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Edit Event"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button 
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Event"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
          {event.title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {event.description}
        </p>

        {/* Event details */}
        <div className="space-y-2 text-sm text-gray-600">
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

          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Capacity: {event.capacity}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Registration deadline: {formatDate(event.registrationDeadline)}
          </div>
          <div className={`text-xs font-semibold ${isRegistrationOpen ? 'text-emerald-600' : 'text-red-600'}`}>
            {isRegistrationOpen ? 'Registration Open' : 'Registration Closed'}
          </div>
        </div>
      </div>
    </div>
  );
});

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Memoize the admin check to prevent re-renders
  const isAdmin = React.useMemo(() => {
    return user?.role === 'admin' || user?.email?.includes('admin');
  }, [user?.role, user?.email]);

  // Initialize user data once and handle auth changes
  useEffect(() => {
    const initializeAuth = () => {
      const userData = readAuthFromStorage();
      setUser(userData.user);
    };

    initializeAuth();

    // Listen for auth changes to update user state
    const handleAuthChange = () => {
      const userData = readAuthFromStorage();
      setUser(userData.user);
    };

    // Listen for storage changes (login/logout in other tabs)
    window.addEventListener('storage', handleAuthChange);
    // Listen for custom auth-changed event
    window.addEventListener('auth-changed', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const events = await EventAPI.getAll();
      setEvents(prevEvents => {
        // Only update if events actually changed to prevent unnecessary re-renders
        const newEvents = events || [];
        if (JSON.stringify(prevEvents) !== JSON.stringify(newEvents)) {
          return newEvents;
        }
        return prevEvents;
      });
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Use a flag to prevent double-fetching in React StrictMode
    let isMounted = true;
    
    const loadEvents = async () => {
      if (isMounted) {
        await fetchEvents();
      }
    };

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, [fetchEvents]);

  const handleDeleteEvent = useCallback(async (eventId) => {
    try {
      await EventAPI.delete(eventId);
      toast.success('Event deleted successfully');
      fetchEvents(); // Refresh the list
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  }, [fetchEvents]);

  const handleEditEvent = useCallback((eventId) => {
    navigate(`/events/${eventId}/edit`);
  }, [navigate]);

  const filteredEvents = useMemo(() => {
    return filterCategory === 'All' 
      ? events 
      : events.filter(event => event.category === filterCategory);
  }, [events, filterCategory]);

  const categories = useMemo(() => ['All', 'Workshop', 'Webinar', 'Field Visit'], []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
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
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-emerald-700 mb-2">
              Agricultural Events 🌾
            </h1>
            <p className="text-lg text-gray-600">
              Join workshops, webinars, and field visits to enhance your agricultural knowledge
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            {isAdmin && (
              <Link
                to="/events/add"
                className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Event
              </Link>
            )}
            {!isAdmin && user && (
              <Link
                to="/my-events"
                className="inline-flex items-center px-6 py-3 bg-white text-emerald-600 border border-emerald-600 rounded-lg shadow hover:bg-emerald-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Registered Events
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterCategory === category
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-emerald-50 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Events Found</h3>
            <p className="text-gray-500 mb-6">
              {filterCategory === 'All' ? 'No events available at the moment.' : `No ${filterCategory.toLowerCase()}s available.`}
            </p>
            {isAdmin && (
              <Link
                to="/events/add"
                className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create First Event
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                isAdmin={isAdmin}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
              />
            ))}
          </div>
        )}

        {/* User Actions moved to header */}
      </div>
    </div>
  );
};

export default EventsPage;