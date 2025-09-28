// src/api/events.js
import { api } from "../utils/api";

export const EventAPI = {
  // Event CRUD operations
  async getAll() {
    try {
      const response = await api.get('/events');
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/events/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },

  async create(eventData) {
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  async update(id, eventData) {
    try {
      const response = await api.put(`/events/${id}`, eventData);
      return response.data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/events/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
};

export const EventRegistrationAPI = {
  // Registration CRUD operations
  async getAll(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/eventregistration?${queryString}` : '/eventregistration';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching registrations:', error);
      throw error;
    }
  },

  async getByFarmerId(farmerId) {
    try {
      console.log('Fetching registrations for farmerId:', farmerId);
      const response = await api.get(`/eventregistration?farmerId=${farmerId}`);
      console.log('API response for getByFarmerId:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user registrations:', error);
      throw error;
    }
  },

  async getByEventId(eventId) {
    try {
      const response = await api.get(`/eventregistration?eventId=${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event registrations:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/eventregistration/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching registration:', error);
      throw error;
    }
  },

  async create(registrationData) {
    try {
      const response = await api.post('/eventregistration', registrationData);
      return response.data;
    } catch (error) {
      console.error('Error creating registration:', error);
      throw error;
    }
  },

  async update(id, registrationData) {
    try {
      const response = await api.put(`/eventregistration/${id}`, registrationData);
      return response.data;
    } catch (error) {
      console.error('Error updating registration:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/eventregistration/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting registration:', error);
      throw error;
    }
  },

  // Check if user is registered for an event
  async checkRegistration(farmerId, eventId) {
    try {
      const response = await api.get(`/eventregistration?farmerId=${farmerId}&eventId=${eventId}`);
      return response.data.length > 0;
    } catch (error) {
      console.error('Error checking registration status:', error);
      return false;
    }
  }
};

export const EventFeedbackAPI = {
  // Feedback CRUD operations
  async getAll(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/eventfeedback?${queryString}` : '/eventfeedback';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      throw error;
    }
  },

  async getByEventId(eventId) {
    try {
      const response = await api.get(`/eventfeedback?eventId=${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event feedbacks:', error);
      throw error;
    }
  },

  async getByFarmerId(farmerId) {
    try {
      const response = await api.get(`/eventfeedback?farmerId=${farmerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user feedbacks:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/eventfeedback/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }
  },

  async create(feedbackData) {
    try {
      const response = await api.post('/eventfeedback', feedbackData);
      return response.data;
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  },

  async update(id, feedbackData) {
    try {
      const response = await api.put(`/eventfeedback/${id}`, feedbackData);
      return response.data;
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/eventfeedback/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  },

  // Check if user has already submitted feedback for an event
  async checkFeedback(farmerId, eventId) {
    try {
      const response = await api.get(`/eventfeedback?farmerId=${farmerId}&eventId=${eventId}`);
      return response.data.length > 0;
    } catch (error) {
      console.error('Error checking feedback status:', error);
      return false;
    }
  }
};

// Combined utilities for common operations
export const EventUtils = {
  // Get event with registration status for a specific user
  async getEventWithRegistrationStatus(eventId, farmerId) {
    try {
      const [event, isRegistered] = await Promise.all([
        EventAPI.getById(eventId),
        farmerId ? EventRegistrationAPI.checkRegistration(farmerId, eventId) : false
      ]);
      
      return {
        ...event,
        isRegistered
      };
    } catch (error) {
      console.error('Error fetching event with registration status:', error);
      throw error;
    }
  },

  // Get event statistics (registrations count, feedback stats)
  async getEventStats(eventId) {
    try {
      const [registrations, feedbacks] = await Promise.all([
        EventRegistrationAPI.getByEventId(eventId),
        EventFeedbackAPI.getByEventId(eventId)
      ]);

      const registrationCount = registrations.length;
      const feedbackCount = feedbacks.length;
      const averageRating = feedbacks.length > 0 
        ? feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbacks.length 
        : 0;

      return {
        registrationCount,
        feedbackCount,
        averageRating: Math.round(averageRating * 10) / 10 // Round to 1 decimal
      };
    } catch (error) {
      console.error('Error fetching event stats:', error);
      return {
        registrationCount: 0,
        feedbackCount: 0,
        averageRating: 0
      };
    }
  },

  // Get user's complete event history
  async getUserEventHistory(farmerId) {
    try {
      const [registrations, feedbacks] = await Promise.all([
        EventRegistrationAPI.getByFarmerId(farmerId),
        EventFeedbackAPI.getByFarmerId(farmerId)
      ]);

      return {
        registrations,
        feedbacks,
        totalEvents: registrations.length,
        feedbacksGiven: feedbacks.length
      };
    } catch (error) {
      console.error('Error fetching user event history:', error);
      throw error;
    }
  }
};