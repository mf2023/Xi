/**
 * Copyright © 2026 Wenze Wei. All Rights Reserved.
 *
 * This file is part of Xi.
 * The Xi project belongs to the Dunimd Team.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, AlertCircle, Info, AlertTriangle, Calendar, Sun, Cloud, CheckCheck, Settings2, Wifi, Bluetooth, Volume2, ChevronDown, ChevronUp } from "lucide-react";
import { useStatusStore } from "@/lib/stores/status-store";
import type { StatusNotification } from "@/lib/api/status-ws";

const getNotificationIcon = (type: StatusNotification["type"]) => {
  switch (type) {
    case "success":
      return <Check className="h-4 w-4 text-green-500" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

const getIconClass = (type: StatusNotification["type"]) => {
  switch (type) {
    case "success":
      return "notification-item__icon--success";
    case "warning":
      return "notification-item__icon--warning";
    case "error":
      return "notification-item__icon--error";
    default:
      return "notification-item__icon--info";
  }
};

const formatTime = (timeStr: string) => {
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
};

interface ControlButtonProps {
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

function ControlButton({ icon, active = false, onClick }: ControlButtonProps) {
  return (
    <button
      className={`control-btn ${active ? 'control-btn--active' : ''}`}
      onClick={onClick}
    >
      <div className="control-btn__icon">
        {icon}
      </div>
    </button>
  );
}

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
}

export function NotificationPopup({ isOpen, onClose, anchorRef }: NotificationPopupProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isNotificationsExpanded, setIsNotificationsExpanded] = useState(true);
  const popupRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    networkEnabled,
    bluetooth,
    muted,
    setNetwork,
    setBluetooth,
    setMuted,
    markRead,
    deleteNotification,
    clearNotifications,
  } = useStatusStore();

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, anchorRef]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleMarkAsRead = (id: string) => {
    markRead(id);
  };

  const handleClearNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const handleClearAll = () => {
    clearNotifications();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className={`notification-panel ${isClosing ? 'notification-panel--hidden' : ''}`}
    >
      <div className="notification-panel__box notification-panel__box--date acrylic">
        <div className="notification-panel__date-bar">
          <div className="notification-panel__date">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="notification-panel__weather">
            <Sun className="h-3.5 w-3.5" />
            <span>24°C</span>
            <Cloud className="h-3.5 w-3.5" style={{ marginLeft: '4px' }} />
          </div>
        </div>
      </div>

      <div className="notification-panel__box notification-panel__box--controls acrylic">
        <div className="notification-panel__header">
          <div className="notification-panel__title">
            <Settings2 className="h-4 w-4" />
            <span className="notification-panel__title-text">Control Center</span>
          </div>
        </div>
        <div className="notification-panel__controls-content">
          <div className="control-grid">
            <ControlButton
              icon={<Wifi className="h-5 w-5" />}
              active={networkEnabled}
              onClick={() => setNetwork(!networkEnabled)}
            />
            <ControlButton
              icon={<Bluetooth className="h-5 w-5" />}
              active={bluetooth}
              onClick={() => setBluetooth(!bluetooth)}
            />
            <ControlButton
              icon={<Volume2 className="h-5 w-5" />}
              active={!muted}
              onClick={() => setMuted(!muted)}
            />
          </div>
        </div>
      </div>

      <div className={`notification-panel__box notification-panel__box--notifications acrylic ${isNotificationsExpanded ? 'notification-panel__box--expanded' : 'notification-panel__box--collapsed'}`}>
        <div className="notification-panel__header">
          <div className="notification-panel__title">
            <span className="notification-panel__title-text">Notifications</span>
            {unreadCount > 0 && (
              <span className="notification-panel__badge">{unreadCount}</span>
            )}
          </div>
          <button
            className="notification-panel__collapse-btn"
            onClick={() => setIsNotificationsExpanded(!isNotificationsExpanded)}
          >
            {isNotificationsExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {isNotificationsExpanded && (
          <>
            <div className="notification-panel__content">
              {notifications.length === 0 ? (
                <div className="notification-panel__empty">
                  <Bell className="h-10 w-10 notification-panel__empty-icon" />
                  <p className="notification-panel__empty-text">No notifications</p>
                </div>
              ) : (
                notifications.map((notification: StatusNotification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'notification-item--unread' : ''}`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className={`notification-item__icon ${getIconClass(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-item__body">
                      <p className="notification-item__title">{notification.title}</p>
                      <p className="notification-item__message">{notification.message}</p>
                      <p className="notification-item__time">{formatTime(notification.time)}</p>
                    </div>
                    {!notification.read && <div className="notification-item__dot" />}
                  </div>
                ))
              )}
            </div>

            <div className="notification-panel__footer">
              <button
                className="notification-panel__clear-btn"
                onClick={handleClearAll}
                disabled={notifications.length === 0}
              >
                <CheckCheck className="h-4 w-4" />
                <span>Clear all</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
