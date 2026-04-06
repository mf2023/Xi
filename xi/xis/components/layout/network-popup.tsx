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
import { Wifi, Globe, Signal, WifiOff, Settings, RefreshCw, Info, Lock } from "lucide-react";
import { useStatusStore } from "@/lib/stores/status-store";
import type { NetworkType, WifiNetwork } from "@/lib/api/status-ws";
import { useI18n } from "@/lib/i18n";

interface NetworkPopupProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
}

const getNetworkIcon = (type: NetworkType, className: string = "h-4 w-4") => {
  switch (type) {
    case "ethernet":
      return <Globe className={className} />;
    case "wifi":
      return <Wifi className={className} />;
    case "mobile":
      return <Signal className={className} />;
    default:
      return <WifiOff className={className} />;
  }
};

const getSignalBars = (signal: number) => {
  if (signal >= 80) return 4;
  if (signal >= 60) return 3;
  if (signal >= 40) return 2;
  return 1;
};

export function NetworkPopup({ isOpen, onClose, anchorRef }: NetworkPopupProps) {
  const { t } = useI18n();
  const [isClosing, setIsClosing] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  const { 
    networkType, 
    networkEnabled, 
    setNetwork, 
    refreshNetwork,
    wifiNetworks,
    connectedSsid,
    getWifiNetworks
  } = useStatusStore();

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
      getWifiNetworks();
    }
  }, [isOpen, anchorRef, getWifiNetworks]);

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

  if (!isOpen) return null;

  const isConnected = networkEnabled && networkType !== "none";
  const connectedNetwork = wifiNetworks.find(n => n.ssid === connectedSsid);
  const otherNetworks = wifiNetworks.filter(n => n.ssid !== connectedSsid);

  const getNetworkTitle = (type: NetworkType): string => {
    switch (type) {
      case "ethernet":
        return t("network.ethernet");
      case "wifi":
        return t("network.wlan");
      case "mobile":
        return t("network.mobileData");
      default:
        return t("network.network");
    }
  };

  return (
    <div
      ref={popupRef}
      className={`network-popup ${isClosing ? 'network-popup--hidden' : ''}`}
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`,
      }}
    >
      <div className="network-popup__container acrylic">
        {/* Header */}
        <div className="network-popup__header">
          <span className="network-popup__header-title">{getNetworkTitle(networkType)}</span>
          <button
            className={`network-popup__switch ${isConnected ? 'network-popup__switch--on' : ''}`}
            onClick={() => setNetwork(!networkEnabled)}
            aria-label="Toggle network"
          >
            <span className="network-popup__switch-thumb"></span>
          </button>
        </div>

        {/* Connected Network */}
        {isConnected && connectedNetwork && (
          <div className="network-popup__connected">
            <div className="network-popup__connected-left">
              <div className="network-popup__connected-bar"></div>
              <div className="network-popup__connected-icon">
                <Wifi className="h-5 w-5" />
                {connectedNetwork.secured && <Lock className="h-3 w-3 network-popup__lock-icon" />}
              </div>
            </div>
            <div className="network-popup__connected-body">
              <span className="network-popup__connected-name">{connectedNetwork.ssid}</span>
              <span className="network-popup__connected-status">{t("network.connectedSecure")}</span>
            </div>
            <button className="network-popup__info-btn">
              <Info className="h-5 w-5" />
            </button>
            <button className="network-popup__disconnect-btn">
              {t("network.disconnect")}
            </button>
          </div>
        )}

        {/* Network List */}
        {networkEnabled && (
          <div className="network-popup__list">
            {otherNetworks.map((network, index) => (
              <div key={index} className="network-popup__network-item">
                <div className="network-popup__network-icon">
                  <Wifi className="h-5 w-5" />
                  {network.secured && <Lock className="h-3 w-3 network-popup__lock-icon" />}
                </div>
                <span className="network-popup__network-name">{network.ssid}</span>
                <div className="network-popup__signal-bars">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={`network-popup__signal-bar ${i < getSignalBars(network.signal) ? 'network-popup__signal-bar--active' : ''}`}
                    />
                  ))}
                </div>
              </div>
            ))}
            {otherNetworks.length === 0 && !connectedNetwork && (
              <div className="network-popup__empty">
                <span>{t("network.scanning")}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="network-popup__footer">
          <span className="network-popup__footer-text">{t("network.moreWifiSettings")}</span>
          <div className="network-popup__footer-actions">
            <button className="network-popup__footer-icon-btn">
              <Settings className="h-4 w-4" />
            </button>
            <button className="network-popup__footer-icon-btn" onClick={() => { refreshNetwork(); getWifiNetworks(); }}>
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
