// src/pages/Event/AddEvent.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { EventAPI } from "../api/events";
import toast from "react-hot-toast";

const AddEvent = () => {
  const navigate = useNavigate();
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
  
  // Validation states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Validation functions
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'title':
        if (!value.trim()) {
          newErrors.title = 'Event title is required';
        } else if (value.trim().length < 3) {
          newErrors.title = 'Title must be at least 3 characters';
        } else if (value.trim().length > 100) {
          newErrors.title = 'Title must be less than 100 characters';
        } else {
          delete newErrors.title;
        }
        break;
        
      case 'description':
        if (!value.trim()) {
          newErrors.description = 'Description is required';
        } else if (value.trim().length < 10) {
          newErrors.description = 'Description must be at least 10 characters';
        } else if (value.trim().length > 1000) {
          newErrors.description = 'Description must be less than 1000 characters';
        } else {
          delete newErrors.description;
        }
        break;
        
      case 'trainerName':
        if (!value.trim()) {
          newErrors.trainerName = 'Trainer name is required';
        } else if (value.trim().length < 2) {
          newErrors.trainerName = 'Trainer name must be at least 2 characters';
        } else if (value.trim().length > 50) {
          newErrors.trainerName = 'Trainer name must be less than 50 characters';
        } else if (!/^[a-zA-Z\s.-]+$/.test(value.trim())) {
          newErrors.trainerName = 'Trainer name can only contain letters, spaces, dots, and hyphens';
        } else {
          delete newErrors.trainerName;
        }
        break;
        
      case 'date':
        if (!value) {
          newErrors.date = 'Event date is required';
        } else {
          const eventDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (eventDate <= today) {
            newErrors.date = 'Event date must be in the future';
          } else {
            delete newErrors.date;
          }
        }
        break;
        
      case 'time':
        if (!value) {
          newErrors.time = 'Start time is required';
        } else {
          delete newErrors.time;
        }
        break;
        
      case 'location':
        if (!value.trim()) {
          newErrors.location = 'Location is required';
        } else if (value.trim().length < 3) {
          newErrors.location = 'Location must be at least 3 characters';
        } else if (value.trim().length > 200) {
          newErrors.location = 'Location must be less than 200 characters';
        } else {
          delete newErrors.location;
        }
        break;
        
      case 'capacity':
        if (!value) {
          newErrors.capacity = 'Capacity is required';
        } else {
          const capacity = parseInt(value);
          if (isNaN(capacity) || capacity <= 0) {
            newErrors.capacity = 'Capacity must be a positive number';
          } else if (capacity > 10000) {
            newErrors.capacity = 'Capacity cannot exceed 10,000';
          } else {
            delete newErrors.capacity;
          }
        }
        break;
        
      case 'registrationDeadline':
        if (!value) {
          newErrors.registrationDeadline = 'Registration deadline is required';
        } else {
          const regDeadline = new Date(value);
          const eventDate = new Date(formData.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (regDeadline <= today) {
            newErrors.registrationDeadline = 'Registration deadline must be in the future';
          } else if (formData.date && regDeadline >= eventDate) {
            newErrors.registrationDeadline = 'Registration deadline must be before the event date';
          } else {
            delete newErrors.registrationDeadline;
          }
        }
        break;
        
      case 'duration':
        if (value && value.trim().length > 50) {
          newErrors.duration = 'Duration must be less than 50 characters';
        } else {
          delete newErrors.duration;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate field if it has been touched
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  // Check form validity whenever form data or errors change
  useEffect(() => {
    const requiredFields = ['title', 'description', 'trainerName', 'date', 'time', 'location', 'capacity', 'registrationDeadline'];
    const hasRequiredFields = requiredFields.every(field => formData[field] && formData[field].trim());
    const hasNoErrors = Object.keys(errors).length === 0;
    
    setIsFormValid(hasRequiredFields && hasNoErrors);
  }, [formData, errors]);

  const validateForm = () => {
    // Mark all fields as touched to show all errors
    const allFields = ['title', 'description', 'trainerName', 'date', 'time', 'location', 'capacity', 'registrationDeadline', 'duration'];
    const newTouched = {};
    allFields.forEach(field => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    // Validate all fields
    const newErrors = {};
    allFields.forEach(field => {
      const isValid = validateField(field, formData[field]);
      if (!isValid) {
        newErrors[field] = errors[field];
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors before submitting");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await EventAPI.create({
        ...formData,
        capacity: parseInt(formData.capacity),
        createdBy: 'Admin'
      });
      
      toast.success('Event created successfully!');
      navigate('/admin/event');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(error?.response?.data?.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/admin/event"
              className="p-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-emerald-700">Create New Event</h1>
              <p className="text-gray-600 mt-1">Add a new agricultural event for the community</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100">
          {/* Form Validation Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-semibold text-red-800">Please fix the following errors:</h3>
              </div>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field} className="capitalize">{field.replace(/([A-Z])/g, ' $1').toLowerCase()}: {error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Basic Information */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  maxLength={100}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    touched.title && errors.title 
                      ? 'border-red-300 bg-red-50' 
                      : touched.title && !errors.title 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter event title"
                />
                {touched.title && errors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.title}
                  </p>
                )}
                {touched.title && !errors.title && formData.title && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <span className="mr-1">✓</span>
                    Title looks good
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.title.length}/100 characters
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  maxLength={1000}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    touched.description && errors.description 
                      ? 'border-red-300 bg-red-50' 
                      : touched.description && !errors.description 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Describe the event, what participants will learn, and any prerequisites"
                />
                {touched.description && errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.description}
                  </p>
                )}
                {touched.description && !errors.description && formData.description && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <span className="mr-1">✓</span>
                    Description looks good
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.description.length}/1000 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trainer Name *
                </label>
                <input
                  type="text"
                  name="trainerName"
                  value={formData.trainerName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  maxLength={50}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    touched.trainerName && errors.trainerName 
                      ? 'border-red-300 bg-red-50' 
                      : touched.trainerName && !errors.trainerName 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Name of the trainer/speaker"
                />
                {touched.trainerName && errors.trainerName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.trainerName}
                  </p>
                )}
                {touched.trainerName && !errors.trainerName && formData.trainerName && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <span className="mr-1">✓</span>
                    Trainer name looks good
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="Workshop">Workshop</option>
                  <option value="Webinar">Webinar</option>
                  <option value="Field Visit">Field Visit</option>
                </select>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    touched.date && errors.date 
                      ? 'border-red-300 bg-red-50' 
                      : touched.date && !errors.date 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300'
                  }`}
                />
                {touched.date && errors.date && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.date}
                  </p>
                )}
                {touched.date && !errors.date && formData.date && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <span className="mr-1">✓</span>
                    Date looks good
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    touched.time && errors.time 
                      ? 'border-red-300 bg-red-50' 
                      : touched.time && !errors.time 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300'
                  }`}
                />
                {touched.time && errors.time && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.time}
                  </p>
                )}
                {touched.time && !errors.time && formData.time && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <span className="mr-1">✓</span>
                    Time looks good
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duration (Optional)
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={50}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    touched.duration && errors.duration 
                      ? 'border-red-300 bg-red-50' 
                      : touched.duration && !errors.duration && formData.duration
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="e.g., 2 hours, Half day"
                />
                {touched.duration && errors.duration && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.duration}
                  </p>
                )}
                {touched.duration && !errors.duration && formData.duration && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <span className="mr-1">✓</span>
                    Duration looks good
                  </p>
                )}
              </div>
            </div>

            {/* Location and Capacity */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  maxLength={200}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    touched.location && errors.location 
                      ? 'border-red-300 bg-red-50' 
                      : touched.location && !errors.location 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Event venue or online platform"
                />
                {touched.location && errors.location && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.location}
                  </p>
                )}
                {touched.location && !errors.location && formData.location && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <span className="mr-1">✓</span>
                    Location looks good
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Capacity *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  min="1"
                  max="10000"
                  className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    touched.capacity && errors.capacity 
                      ? 'border-red-300 bg-red-50' 
                      : touched.capacity && !errors.capacity 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Maximum participants"
                />
                {touched.capacity && errors.capacity && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.capacity}
                  </p>
                )}
                {touched.capacity && !errors.capacity && formData.capacity && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <span className="mr-1">✓</span>
                    Capacity looks good
                  </p>
                )}
              </div>
            </div>

            {/* Registration Deadline */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Registration Deadline *
              </label>
              <input
                type="date"
                name="registrationDeadline"
                value={formData.registrationDeadline}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                min={new Date().toISOString().split('T')[0]}
                max={formData.date || undefined}
                className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  touched.registrationDeadline && errors.registrationDeadline 
                    ? 'border-red-300 bg-red-50' 
                    : touched.registrationDeadline && !errors.registrationDeadline 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300'
                }`}
              />
              {touched.registrationDeadline && errors.registrationDeadline && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.registrationDeadline}
                </p>
              )}
              {touched.registrationDeadline && !errors.registrationDeadline && formData.registrationDeadline && (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <span className="mr-1">✓</span>
                  Registration deadline looks good
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Last date for participants to register (must be before event date)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting || !isFormValid}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Event...
                  </div>
                ) : (
                  'Create Event'
                )}
              </button>
              
              <Link
                to="/admin/event"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-emerald-800 mb-3">💡 Event Creation Tips</h3>
          <ul className="text-emerald-700 space-y-2 text-sm">
            <li>• Write a clear, descriptive title that highlights the main topic</li>
            <li>• Include learning objectives and target audience in the description</li>
            <li>• Set realistic capacity based on venue or platform limitations</li>
            <li>• Allow enough time between registration deadline and event date</li>
            <li>• Consider time zones if hosting online events</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddEvent;
