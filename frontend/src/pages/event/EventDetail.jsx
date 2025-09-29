// src/pages/Event/EventDetail.jsx
import React, { useState, useEffect, useRef } from "react";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useParams, useNavigate, Link } from "react-router-dom";
import { EventAPI, EventRegistrationAPI, EventFeedbackAPI, EventUtils } from "../../api/events";
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

const FeedbackForm = ({ eventId, onFeedbackSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = readAuthFromStorage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to submit feedback");
      return;
    }

    try {
      setSubmitting(true);
      await EventFeedbackAPI.create({
        farmerId: user._id || user.id,
        eventId,
        rating,
        comments
      });
      toast.success("Feedback submitted successfully!");
      setComments("");
      setRating(5);
      onFeedbackSubmitted();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Share Your Feedback</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Rating
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`w-8 h-8 ${
                star <= rating ? "text-yellow-400" : "text-gray-300"
              } hover:text-yellow-400 transition-colors`}
            >
              <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.985 2.126c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.38 8.719c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Comments (Optional)
        </label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="Share your thoughts about this event..."
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
};

const FeedbackList = ({ feedbacks, currentUser, onEdited, onDeleted }) => {
  if (!feedbacks || feedbacks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.993-.523l-2.783 2.783a1 1 0 01-1.414-1.414l2.783-2.783A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
        </svg>
        <p>No feedback yet. Be the first to share your thoughts!</p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {feedbacks.map((fb, index) => (
        <EditableFeedbackItem
          key={fb._id || index}
          feedback={fb}
          currentUser={currentUser}
          onEdited={onEdited}
          onDeleted={onDeleted}
        />
      ))}
    </div>
  );
};

const EditableFeedbackItem = ({ feedback, currentUser, onEdited, onDeleted }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [rating, setRating] = React.useState(feedback.rating);
  const [comments, setComments] = React.useState(feedback.comments || "");
  const [saving, setSaving] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const isOwner = currentUser && (currentUser._id === feedback.farmerId || currentUser.id === feedback.farmerId);
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email?.includes('admin');

  const handleSave = async () => {
    try {
      setSaving(true);
      await EventFeedbackAPI.update(feedback._id, { rating, comments });
      toast.success('Feedback updated');
      setIsEditing(false);
      onEdited && onEdited();
    } catch (err) {
      console.error('Failed to update feedback', err);
      toast.error('Failed to update feedback');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await EventFeedbackAPI.delete(feedback._id);
      toast.success('Feedback deleted');
      onDeleted && onDeleted();
    } catch (err) {
      console.error('Failed to delete feedback', err);
      toast.error('Failed to delete feedback');
    } finally {
      setConfirmOpen(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-4 h-4 ${star <= (isEditing ? rating : feedback.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
                onClick={() => isEditing && setRating(star)}
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.985 2.126c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.38 8.719c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-gray-600">{(isEditing ? rating : feedback.rating)}/5</span>
        </div>
        <span className="text-xs text-gray-400">{new Date(feedback.createdAt).toLocaleDateString()}</span>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Update your feedback..."
          />
          <div className="flex gap-2 justify-end">
            <button
              disabled={saving}
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        feedback.comments && <p className="text-gray-700 text-sm">{feedback.comments}</p>
      )}

      {(isOwner || isAdmin) && !isEditing && (
        <div className="flex gap-2 justify-end mt-3">
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 text-emerald-600 border border-emerald-600 rounded-md text-sm hover:bg-emerald-50"
          >
            Edit
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            className="px-3 py-1 text-red-600 border border-red-600 rounded-md text-sm hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Delete feedback?"
        message="This will permanently remove your feedback from this event."
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

const RegistrationForm = ({ eventId, onRegistrationComplete }) => {
  const [contactInfo, setContactInfo] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = readAuthFromStorage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to register for events");
      return;
    }

    try {
      setSubmitting(true);
      await EventRegistrationAPI.create({
        farmerId: user._id || user.id,
        farmerName: `${user.firstName} ${user.lastName}`,
        eventId,
        contactInfo,
        specialNotes
      });
      toast.success("Registration successful!");
      onRegistrationComplete();
    } catch (error) {
      console.error('Error registering for event:', error);
      toast.error(error.response?.data?.message || "Failed to register for event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Register for Event</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Contact Information *
        </label>
        <input
          type="text"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="Phone number or email"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Special Notes (Optional)
        </label>
        <textarea
          value={specialNotes}
          onChange={(e) => setSpecialNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="Any special requirements or notes..."
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Registering..." : "Register Now"}
      </button>
    </form>
  );
};

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const { user } = readAuthFromStorage();

  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');

  useEffect(() => {
    fetchEventDetails();
    if (user) {
      checkRegistrationStatus();
    }
    fetchFeedbacks();
  }, [id, user]);

  // Track component mount status to avoid setState on unmounted component
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const fetchEventDetails = async () => {
    try {
      const event = await EventAPI.getById(id);
      if (!aliveRef.current) return;
      setEvent(event);
    } catch (error) {
      // Avoid noisy logs after navigating away; show a toast only if still on page
      if (aliveRef.current) {
        toast.error('Failed to load event details');
        navigate('/events');
      }
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      const isRegistered = await EventRegistrationAPI.checkRegistration(user._id || user.id, id);
      if (aliveRef.current) setIsRegistered(isRegistered);
    } catch (error) {
      // Silently ignore if navigated away
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const feedbacks = await EventFeedbackAPI.getByEventId(id);
      if (aliveRef.current) setFeedbacks(feedbacks || []);
    } catch (error) {
      // Ignore errors if unmounted or navigating away
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const handleDelete = () => setConfirmOpen(true);
  const confirmDelete = async () => {
    try {
      // Close modal immediately to avoid setState after unmount
      if (aliveRef.current) setConfirmOpen(false);
      await EventAPI.delete(id);
      toast.success('Event deleted successfully');
      navigate('/events');
    } catch (error) {
      // Only show error if we're still on this page
      if (aliveRef.current) {
        toast.error('Failed to delete event');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isRegistrationOpen = () => {
    return new Date() <= new Date(event?.registrationDeadline);
  };

  const isPastEvent = () => {
    return new Date() > new Date(event?.date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
          <Link
            to="/events"
            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition-colors"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/events')}
              className="p-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-emerald-700">{event.title}</h1>
              <p className="text-gray-600 mt-1">Created by {event.createdBy}</p>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Link
                  to={`/events/${id}/edit`}
                  className="px-4 py-2 text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-emerald-100">
              <div className="flex items-center gap-4 mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  event.category === 'Workshop' ? 'bg-blue-100 text-blue-800' :
                  event.category === 'Webinar' ? 'bg-purple-100 text-purple-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {event.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isRegistrationOpen() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isRegistrationOpen() ? 'Registration Open' : 'Registration Closed'}
                </span>
              </div>

              <div className="prose prose-emerald max-w-none mb-8">
                <p className="text-gray-700 text-lg leading-relaxed">{event.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Date & Time</p>
                    <p>{formatDate(event.date)} at {event.time}</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Location</p>
                    <p>{event.location}</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Trainer</p>
                    <p>{event.trainerName}</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Capacity</p>
                    <p>{event.capacity} participants</p>
                  </div>
                </div>

                {event.duration && (
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold">Duration</p>
                      <p>{event.duration}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Registration Deadline</p>
                    <p>{formatDate(event.registrationDeadline)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Section - Only show for past events */}
            {isPastEvent() && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Event Feedback</h2>
                
                {user && !isAdmin && (
                  <FeedbackForm 
                    eventId={id} 
                    onFeedbackSubmitted={fetchFeedbacks}
                  />
                )}

                <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    What People Are Saying ({feedbacks.length})
                  </h3>
                  <FeedbackList
                    feedbacks={feedbacks}
                    currentUser={user}
                    onEdited={fetchFeedbacks}
                    onDeleted={fetchFeedbacks}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Section - Only show for future events */}
            {!isPastEvent() && user && !isAdmin && (
              <div>
                {isRegistered ? (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                    <div className="flex items-center mb-4">
                      <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-lg font-bold text-green-800">You're Registered!</h3>
                    </div>
                    <p className="text-green-700 mb-4">
                      You have successfully registered for this event. Check your email for confirmation details.
                    </p>
                    <Link
                      to="/my-events"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      View My Events
                    </Link>
                  </div>
                ) : (
                  <div>
                    {isRegistrationOpen() ? (
                      showRegistrationForm ? (
                        <RegistrationForm 
                          eventId={id}
                          onRegistrationComplete={() => {
                            setIsRegistered(true);
                            setShowRegistrationForm(false);
                          }}
                        />
                      ) : (
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Register for Event</h3>
                          <p className="text-gray-600 mb-6">
                            Don't miss out on this valuable learning opportunity. Register now to secure your spot!
                          </p>
                          <button
                            onClick={() => setShowRegistrationForm(true)}
                            className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition-colors"
                          >
                            Register Now
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-red-800 mb-2">Registration Closed</h3>
                        <p className="text-red-700">
                          The registration deadline for this event has passed.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Login prompt for non-logged users */}
            {!user && !isPastEvent() && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-emerald-800 mb-2">Want to Join?</h3>
                <p className="text-emerald-700 mb-4">
                  Please login to register for this event and connect with other participants.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Login to Register
                </Link>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/events"
                  className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Browse All Events
                </Link>
                
                {user && !isAdmin && (
                  <Link
                    to="/my-events"
                    className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    My Registered Events
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Event Delete Confirmation Modal (rendered in main view) */}
      <ConfirmModal
        open={confirmOpen}
        title="Delete event?"
        message={event ? `This will permanently delete "${event.title}".` : 'This will permanently delete the event.'}
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default EventDetail;