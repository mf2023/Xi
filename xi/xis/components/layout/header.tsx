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

import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Wifi, Globe, Signal, WifiOff, Volume2, VolumeX, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./sidebar-context";
import { NotificationPopup } from "./notification-popup";
import { NetworkPopup } from "./network-popup";
import { VolumePopup } from "./volume-popup";
import { useStatusStore } from "@/lib/stores/status-store";
import type { NetworkType } from "@/lib/api/status-ws";

const getNetworkIcon = (type: NetworkType) => {
  switch (type) {
    case "ethernet":
      return <Globe className="h-4 w-4" />;
    case "wifi":
      return <Wifi className="h-4 w-4" />;
    case "mobile":
      return <Signal className="h-4 w-4" />;
    default:
      return <WifiOff className="h-4 w-4" />;
  }
};

const getNetworkTitle = (type: NetworkType): string => {
  switch (type) {
    case "ethernet":
      return "Ethernet Connected";
    case "wifi":
      return "WiFi Connected";
    case "mobile":
      return "Mobile Data Connected";
    default:
      return "No Network Connection";
  }
};

export function Header() {
  const { collapsed, toggle } = useSidebar();
  const [time, setTime] = useState({ hours: "", minutes: "", dayPeriod: "" });
  const [date, setDate] = useState({ month: "", day: "", year: "" });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNetwork, setShowNetwork] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const networkButtonRef = useRef<HTMLButtonElement>(null);
  const volumeButtonRef = useRef<HTMLButtonElement>(null);

  const { networkType, networkEnabled, muted, connect, disconnect, isConnected } = useStatusStore();

  const updateTime = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    setTime({
      hours: hours.toString().padStart(2, "0"),
      minutes: minutes.toString().padStart(2, "0"),
      dayPeriod: "",
    });

    setDate({
      month: (now.getMonth() + 1).toString().padStart(2, "0"),
      day: now.getDate().toString().padStart(2, "0"),
      year: now.getFullYear().toString(),
    });
  }, []);

  useEffect(() => {
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [updateTime]);

  const hasConnectedRef = useRef(false);

  useEffect(() => {
    if (!hasConnectedRef.current) {
      hasConnectedRef.current = true;
      connect();
    }
  }, [connect]);

  const closeAllPopups = () => {
    setShowNotifications(false);
    setShowNetwork(false);
    setShowVolume(false);
  };

  const handleNetworkClick = () => {
    closeAllPopups();
    setShowNetwork(!showNetwork);
  };

  const handleVolumeClick = () => {
    closeAllPopups();
    setShowVolume(!showVolume);
  };

  const handleNotificationClick = () => {
    closeAllPopups();
    setShowNotifications(!showNotifications);
  };

  return (
    <>
      <header className="header">
        <div className="header__left">
          <Button
            variant="secondary"
            size="icon"
            onClick={toggle}
            className="h-8 w-8 bg-muted/50 hover:bg-muted"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="header__right">
          <Button
            ref={networkButtonRef}
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-muted/50 hover:bg-muted"
            onClick={handleNetworkClick}
            title={getNetworkTitle(networkType)}
          >
            {getNetworkIcon(networkType)}
          </Button>

          <Button
            ref={volumeButtonRef}
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-muted/50 hover:bg-muted"
            onClick={handleVolumeClick}
            title={muted ? "Muted" : "Volume"}
          >
            {muted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>

          <Button
            ref={notificationButtonRef}
            variant="secondary"
            className="flex h-8 items-center justify-center gap-2 px-3 bg-muted/50 hover:bg-muted"
            onClick={handleNotificationClick}
            title="Notifications"
          >
            <span className="text-sm font-medium leading-none">
              {time.hours}:{time.minutes}
            </span>
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <NetworkPopup
        isOpen={showNetwork}
        onClose={() => setShowNetwork(false)}
        anchorRef={networkButtonRef}
      />

      <VolumePopup
        isOpen={showVolume}
        onClose={() => setShowVolume(false)}
        anchorRef={volumeButtonRef}
      />

      <NotificationPopup
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        anchorRef={notificationButtonRef}
      />
    </>
  );
}
