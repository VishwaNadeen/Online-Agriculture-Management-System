// backend/services/notificationService.js
import Notification from "../models/Notification.js";

export async function notify(userId, title, message, appointmentId) {
  return Notification.create({ userId, title, message, appointmentId });
}
