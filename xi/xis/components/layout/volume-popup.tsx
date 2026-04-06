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
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { useStatusStore } from "@/lib/stores/status-store";
import { useI18n } from "@/lib/i18n";

interface VolumePopupProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
}

export function VolumePopup({ isOpen, onClose, anchorRef }: VolumePopupProps) {
  const { t } = useI18n();
  const [isClosing, setIsClosing] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  const { volume, muted, setVolume, setMuted } = useStatusStore();

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen, anchorRef]);

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

  const getVolumeIcon = () => {
    if (muted || volume === 0) return <VolumeX className="h-4 w-4" />;
    if (volume < 50) return <Volume1 className="h-4 w-4" />;
    return <Volume2 className="h-4 w-4" />;
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className={`control-popup ${isClosing ? 'control-popup--hidden' : ''}`}
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`,
      }}
    >
      <div className="control-popup__box acrylic">
        <div className="control-popup__header">
          <div className="control-popup__title">
            {getVolumeIcon()}
            <span className="control-popup__title-text">{t("volume.title")}</span>
          </div>
          <button
            className={`control-popup__toggle ${!muted ? 'control-popup__toggle--active' : ''}`}
            onClick={() => setMuted(!muted)}
          >
            <span className="control-popup__toggle-label">{muted ? t("volume.muted") : t("volume.on")}</span>
          </button>
        </div>

        <div className="control-popup__content">
          <div className="volume-control">
            <button
              className="volume-control__icon"
              onClick={() => setMuted(!muted)}
            >
              {getVolumeIcon()}
            </button>
            <div className="volume-control__slider-container">
              <input
                type="range"
                min="0"
                max="100"
                value={muted ? 0 : volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="volume-control__slider"
              />
            </div>
            <span className="volume-control__value">{muted ? 0 : volume}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
