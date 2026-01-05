import { useState, useEffect } from 'react';
import { notificationAPI } from '../utils/api';
import { useNotificationStore } from '../context/store';
import Footer from '../components/Footer';
import '../styles/notifications.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const markAsRead = useNotificationStore((state) => state.markAsRead);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await notificationAPI.getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead({ notificationId: id });
      markAsRead(id);
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getIcon = (type) => {
    const icons = {
      transaction: '💳',
      system: '🔔',
      alert: '⚠️',
      offer: '🎁'
    };
    return icons[type] || '🔔';
  };

  return (
    <>
    <div className="page-container">
      <div className="page-header">
        <h1>Notifications</h1>
        <p>Your updates and alerts</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>All Notifications ({notifications.length})</h3>
        </div>

        <div className="card-body">
          {loading ? (
            <p className="text-center">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">🔔</p>
              <p className="empty-text">No notifications yet</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={`notification-item ${notif.isRead ? '' : 'unread'}`}
                >
                  <div className="notification-icon">
                    {getIcon(notif.type)}
                  </div>
                  <div className="notification-content">
                    <h4 className="notification-title">{notif.title}</h4>
                    <p className="notification-message">{notif.message}</p>
                    <p className="notification-time">
                      {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="notification-actions">
                    {!notif.isRead && (
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleMarkAsRead(notif.id)}
                      >
                        Mark as read
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDelete(notif.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
