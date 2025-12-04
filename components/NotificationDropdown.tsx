
import React from 'react';
import { X, Bell, Info, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead?: () => void;
  onClearAll: () => void;
  onNotificationClick?: (notification: AppNotification) => void;
}

const timeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
  isOpen, 
  onClose, 
  notifications, 
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onNotificationClick
}) => {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fade-in-up origin-top-right">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
          <Bell className="h-4 w-4" /> Notifications
        </h3>
        <div className="flex gap-3">
           {notifications.length > 0 && (
            <>
              {onMarkAllRead && (
                <button onClick={onMarkAllRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  Mark all read
                </button>
              )}
            </>
           )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
            <Bell className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">No new notifications</p>
          </div>
        ) : (
          notifications.slice(0, 10).map(n => (
            <div 
              key={n.id} 
              className={`p-4 border-b border-slate-50 transition-colors cursor-pointer ${n.read ? 'bg-white opacity-70' : 'bg-blue-50/40 hover:bg-blue-50'}`}
              onClick={() => {
                if (onNotificationClick) onNotificationClick(n);
                else onMarkRead(n.id);
              }}
            >
              <div className="flex gap-3 items-start">
                <div className="mt-0.5 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1">
                   <h4 className={`text-sm font-semibold ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</h4>
                   <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                   <div className="flex items-center gap-1 mt-2">
                     <Clock className="h-3 w-3 text-slate-400" />
                     <span className="text-[10px] text-slate-400">
                       {timeAgo(n.timestamp)}
                     </span>
                   </div>
                </div>
                {!n.read && (
                  <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {notifications.length > 0 && (
        <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
          <button onClick={onClearAll} className="text-xs text-slate-500 hover:text-red-600 transition-colors">
            Clear History
          </button>
        </div>
      )}
    </div>
  );
};
