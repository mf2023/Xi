#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Copyright © 2026 Wenze Wei. All Rights Reserved.
#
# This file is part of Xi.
# The Xi project belongs to the Dunimd Team.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Status WebSocket handler for real-time status updates.
"""

import asyncio
import json
import platform
import subprocess
from datetime import datetime
from typing import Dict, Set, Any, Optional, Literal
from fastapi import WebSocket, WebSocketDisconnect

from ...core.dc import XiLogger
from ...session.notification import XiNotificationManager


NetworkType = Literal["ethernet", "wifi", "mobile", "none"]

SUBPROCESS_KWARGS = {
    "capture_output": True,
    "text": True,
    "timeout": 5,
    "encoding": "utf-8",
    "errors": "ignore",
}


def scan_wifi_networks() -> list:
    """
    Scan for available WiFi networks.
    
    Returns:
        list: List of WiFi networks with ssid, signal, secured, connected
    """
    system = platform.system().lower()
    
    try:
        if system == "windows":
            return _scan_wifi_windows()
        elif system == "darwin":
            return _scan_wifi_macos()
        else:
            return _scan_wifi_linux()
    except Exception:
        return []


def _scan_wifi_windows() -> list:
    """Scan WiFi networks on Windows."""
    networks = []
    try:
        result = subprocess.run(
            ["netsh", "wlan", "show", "networks", "mode=bssid"],
            **SUBPROCESS_KWARGS
        )
        
        output = result.stdout
        
        connected_ssid = _get_connected_wifi_windows()
        
        current_network = {}
        for line in output.split('\n'):
            line = line.strip()
            if line.startswith("SSID") and ":" in line:
                if current_network.get("ssid"):
                    networks.append(current_network)
                ssid = line.split(":", 1)[1].strip()
                current_network = {
                    "ssid": ssid if ssid else "Hidden Network",
                    "signal": 0,
                    "secured": True,
                    "connected": ssid == connected_ssid if ssid else False
                }
            elif "信号" in line or "Signal" in line:
                try:
                    signal_str = line.split(":")[1].strip().replace("%", "")
                    current_network["signal"] = int(signal_str)
                except:
                    current_network["signal"] = 50
            elif "身份验证" in line or "Authentication" in line:
                auth = line.split(":")[1].strip().lower()
                current_network["secured"] = "open" not in auth and "开放" not in auth
        
        if current_network.get("ssid"):
            networks.append(current_network)
            
    except Exception:
        pass
    
    return networks


def _get_connected_wifi_windows() -> str:
    """Get the currently connected WiFi SSID on Windows."""
    try:
        result = subprocess.run(
            ["netsh", "wlan", "show", "interfaces"],
            **SUBPROCESS_KWARGS
        )
        
        output = result.stdout
        for line in output.split('\n'):
            line = line.strip()
            if ("SSID" in line or "ssid" in line) and ":" in line:
                if "BSSID" not in line:
                    return line.split(":", 1)[1].strip()
    except Exception:
        pass
    return ""


def _scan_wifi_macos() -> list:
    """Scan WiFi networks on macOS."""
    networks = []
    try:
        result = subprocess.run(
            ["/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport", "-s"],
            **SUBPROCESS_KWARGS
        )
        
        lines = result.stdout.split('\n')
        for line in lines[1:]:
            if line.strip():
                parts = line.split()
                if len(parts) >= 3:
                    networks.append({
                        "ssid": parts[0],
                        "signal": int(parts[2]) if parts[2].isdigit() else 50,
                        "secured": True,
                        "connected": False
                    })
    except Exception:
        pass
    return networks


def _scan_wifi_linux() -> list:
    """Scan WiFi networks on Linux."""
    networks = []
    try:
        result = subprocess.run(
            ["nmcli", "-t", "-f", "SSID,SIGNAL,SECURITY", "dev", "wifi", "list"],
            **SUBPROCESS_KWARGS
        )
        
        for line in result.stdout.strip().split('\n'):
            if line:
                parts = line.split(':')
                if len(parts) >= 3:
                    ssid = parts[0] if parts[0] else "Hidden Network"
                    signal = int(parts[1]) if parts[1].isdigit() else 50
                    secured = bool(parts[2]) if len(parts) > 2 else False
                    networks.append({
                        "ssid": ssid,
                        "signal": signal,
                        "secured": secured,
                        "connected": False
                    })
    except Exception:
        pass
    return networks


def detect_network_type() -> NetworkType:
    """
    Detect the current network connection type.
    
    Returns:
        NetworkType: One of "ethernet", "wifi", "mobile", "none"
    """
    system = platform.system().lower()
    
    try:
        if system == "windows":
            return _detect_network_windows()
        elif system == "darwin":
            return _detect_network_macos()
        else:
            return _detect_network_linux()
    except Exception:
        return "none"


def _detect_network_windows() -> NetworkType:
    """Detect network type on Windows."""
    try:
        result = subprocess.run(
            ["netsh", "interface", "show", "interface"],
            **SUBPROCESS_KWARGS
        )

        output = result.stdout
        output_lower = output.lower()

        is_connected = "connected" in output_lower or "已连接" in output

        if "ethernet" in output_lower and is_connected:
            lines = output_lower.split('\n')
            for line in lines:
                if "ethernet" in line and ("connected" in line or "已连接" in line):
                    return "ethernet"

        if "wi-fi" in output_lower or "wireless" in output_lower or "wlan" in output_lower:
            lines = output_lower.split('\n')
            for line in lines:
                if ("wi-fi" in line or "wireless" in line or "wlan" in line) and ("connected" in line or "已连接" in line):
                    return "wifi"

        result2 = subprocess.run(
            ["netsh", "mbn", "show", "interface"],
            **SUBPROCESS_KWARGS
        )

        output2_lower = result2.stdout.lower()
        if "connected" in output2_lower or "已连接" in result2.stdout:
            return "mobile"

        return "none"
    except Exception:
        return "none"


def _detect_network_macos() -> NetworkType:
    """Detect network type on macOS."""
    try:
        result = subprocess.run(
            ["networksetup", "-listallhardwareports"],
            **SUBPROCESS_KWARGS
        )
        
        output = result.stdout.lower()
        
        if "ethernet" in output:
            result2 = subprocess.run(
                ["ifconfig", "en0"],
                **SUBPROCESS_KWARGS
            )
            if "status: active" in result2.stdout.lower():
                return "ethernet"
        
        if "wi-fi" in output:
            result2 = subprocess.run(
                ["ifconfig", "en1"],
                **SUBPROCESS_KWARGS
            )
            if "status: active" in result2.stdout.lower():
                return "wifi"
        
        return "none"
    except Exception:
        return "none"


def _detect_network_linux() -> NetworkType:
    """Detect network type on Linux."""
    try:
        result = subprocess.run(
            ["ip", "link", "show"],
            **SUBPROCESS_KWARGS
        )
        
        output = result.stdout.lower()
        
        if "eth0" in output or "enp" in output:
            result2 = subprocess.run(
                ["ip", "addr", "show", "eth0"],
                **SUBPROCESS_KWARGS
            )
            if "state up" in result2.stdout.lower():
                return "ethernet"
        
        if "wlan" in output or "wlp" in output:
            for iface in ["wlan0", "wlp2s0", "wlp3s0"]:
                result2 = subprocess.run(
                    ["ip", "addr", "show", iface],
                    **SUBPROCESS_KWARGS
                )
                if "state up" in result2.stdout.lower():
                    return "wifi"
        
        if "wwan" in output or "wwan0" in output:
            result2 = subprocess.run(
                ["ip", "addr", "show", "wwan0"],
                **SUBPROCESS_KWARGS
            )
            if "state up" in result2.stdout.lower():
                return "mobile"
        
        return "none"
    except Exception:
        return "none"


class XiStatusWebSocket:
    """
    WebSocket handler for status management with real-time updates.
    
    Handles: volume, muted, network, notifications, control panel.
    """
    
    _instance: Optional['XiStatusWebSocket'] = None
    
    @classmethod
    def get_instance(cls, logger: XiLogger) -> 'XiStatusWebSocket':
        """Get or create the global status WebSocket handler instance."""
        if cls._instance is None:
            cls._instance = cls(logger)
        return cls._instance

    def __init__(self, logger: XiLogger):
        self.logger = logger
        self.active_connections: Set[WebSocket] = set()
        self.notification_manager = XiNotificationManager()
        
        self._volume: int = 75
        self._muted: bool = False
        self._network_type: NetworkType = detect_network_type()
        self._network_enabled: bool = self._network_type != "none"
        self._bluetooth: bool = False

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.add(websocket)
        self.logger.info(
            f"Status WebSocket connected. Total clients: {len(self.active_connections)}",
            event="xi.status_ws.connect"
        )
        
        await self._send_status(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.discard(websocket)
        self.logger.info(
            f"Status WebSocket disconnected. Total clients: {len(self.active_connections)}",
            event="xi.status_ws.disconnect"
        )

    async def handle_message(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        msg_type = data.get("type")

        if msg_type == "get_status":
            await self._send_status(websocket)
        elif msg_type == "set_volume":
            await self._handle_set_volume(websocket, data)
        elif msg_type == "set_muted":
            await self._handle_set_muted(websocket, data)
        elif msg_type == "set_network":
            await self._handle_set_network(websocket, data)
        elif msg_type == "set_bluetooth":
            await self._handle_set_bluetooth(websocket, data)
        elif msg_type == "refresh_network":
            await self._handle_refresh_network(websocket)
        elif msg_type == "get_notifications":
            await self._handle_get_notifications(websocket)
        elif msg_type == "create_notification":
            await self._handle_create_notification(websocket, data)
        elif msg_type == "mark_read":
            await self._handle_mark_read(websocket, data)
        elif msg_type == "delete_notification":
            await self._handle_delete_notification(websocket, data)
        elif msg_type == "clear_notifications":
            await self._handle_clear_notifications(websocket)
        elif msg_type == "get_wifi_networks":
            await self._handle_get_wifi_networks(websocket)
        else:
            await websocket.send_json({
                "type": "error",
                "message": f"Unknown message type: {msg_type}"
            })

    async def _send_status(self, websocket: WebSocket) -> None:
        """Send current status to client."""
        await websocket.send_json({
            "type": "status",
            "volume": self._volume,
            "muted": self._muted,
            "network_type": self._network_type,
            "network_enabled": self._network_enabled,
            "bluetooth": self._bluetooth,
        })

    async def _handle_set_volume(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        """Handle set volume request."""
        value = data.get("value", 75)
        if isinstance(value, (int, float)):
            self._volume = max(0, min(100, int(value)))
        
        await self._broadcast_status()

    async def _handle_set_muted(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        """Handle set muted request."""
        value = data.get("value", False)
        if isinstance(value, bool):
            self._muted = value
        
        await self._broadcast_status()

    async def _handle_set_network(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        """Handle set network request."""
        enabled = data.get("enabled", True)
        if isinstance(enabled, bool):
            self._network_enabled = enabled
            if not enabled:
                self._network_type = "none"
            else:
                self._network_type = detect_network_type()
        
        await self._broadcast_status()

    async def _handle_refresh_network(self, websocket: WebSocket) -> None:
        """Handle refresh network request."""
        self._network_type = detect_network_type()
        self._network_enabled = self._network_type != "none"
        await self._broadcast_status()

    async def _handle_set_bluetooth(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        """Handle set bluetooth request."""
        enabled = data.get("enabled", False)
        if isinstance(enabled, bool):
            self._bluetooth = enabled
        
        await self._broadcast_status()

    async def _handle_get_notifications(self, websocket: WebSocket) -> None:
        """Handle get notifications request."""
        notifications = self.notification_manager.list_notifications()
        unread_count = self.notification_manager.get_unread_count()
        
        await websocket.send_json({
            "type": "notifications",
            "notifications": [
                {
                    "id": n.id,
                    "type": n.type,
                    "title": n.title,
                    "message": n.message,
                    "time": n.time.isoformat(),
                    "read": n.read,
                    "metadata": n.metadata,
                }
                for n in notifications
            ],
            "unread_count": unread_count,
        })

    async def _handle_create_notification(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        """Handle create notification request."""
        notification_type = data.get("notification_type", "info")
        title = data.get("title", "")
        message = data.get("message", "")
        metadata = data.get("metadata")
        
        notification = self.notification_manager.create_notification(
            notification_type=notification_type,
            title=title,
            message=message,
            metadata=metadata,
        )
        
        notification_data = {
            "id": notification.id,
            "type": notification.type,
            "title": notification.title,
            "message": notification.message,
            "time": notification.time.isoformat(),
            "read": notification.read,
            "metadata": notification.metadata,
        }
        
        await websocket.send_json({
            "type": "notification_created",
            "notification": notification_data,
        })
        
        await self._broadcast_notification_new(notification_data)

    async def _handle_mark_read(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        """Handle mark notification as read request."""
        notification_id = data.get("id")
        if notification_id:
            success = self.notification_manager.mark_read(notification_id)
            if success:
                await self._broadcast_notification_update(notification_id, True)

    async def _handle_delete_notification(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        """Handle delete notification request."""
        notification_id = data.get("id")
        if notification_id:
            success = self.notification_manager.delete_notification(notification_id)
            if success:
                await self._broadcast_notification_delete(notification_id)

    async def _handle_clear_notifications(self, websocket: WebSocket) -> None:
        """Handle clear all notifications request."""
        self.notification_manager.clear_all()
        await self._broadcast_notifications_cleared()

    async def _handle_get_wifi_networks(self, websocket: WebSocket) -> None:
        """Handle get WiFi networks request."""
        networks = scan_wifi_networks()
        connected_ssid = ""
        
        if self._network_type == "wifi":
            system = platform.system().lower()
            if system == "windows":
                connected_ssid = _get_connected_wifi_windows()
        
        await websocket.send_json({
            "type": "wifi_networks",
            "networks": networks,
            "connected_ssid": connected_ssid,
        })

    async def _broadcast_status(self) -> None:
        """Broadcast status to all connected clients."""
        message = {
            "type": "status",
            "volume": self._volume,
            "muted": self._muted,
            "network_type": self._network_type,
            "network_enabled": self._network_enabled,
            "bluetooth": self._bluetooth,
        }
        
        for websocket in list(self.active_connections):
            try:
                await websocket.send_json(message)
            except Exception:
                pass

    async def _broadcast_notification_new(self, notification: Dict[str, Any]) -> None:
        """Broadcast new notification to all connected clients."""
        message = {
            "type": "notification_new",
            "notification": notification,
        }
        
        for websocket in list(self.active_connections):
            try:
                await websocket.send_json(message)
            except Exception:
                pass

    async def _broadcast_notification_update(self, notification_id: str, read: bool) -> None:
        """Broadcast notification update to all connected clients."""
        message = {
            "type": "notification_update",
            "id": notification_id,
            "read": read,
        }
        
        for websocket in list(self.active_connections):
            try:
                await websocket.send_json(message)
            except Exception:
                pass

    async def _broadcast_notification_delete(self, notification_id: str) -> None:
        """Broadcast notification delete to all connected clients."""
        message = {
            "type": "notification_delete",
            "id": notification_id,
        }
        
        for websocket in list(self.active_connections):
            try:
                await websocket.send_json(message)
            except Exception:
                pass

    async def _broadcast_notifications_cleared(self) -> None:
        """Broadcast notifications cleared to all connected clients."""
        message = {
            "type": "notifications_cleared",
        }
        
        for websocket in list(self.active_connections):
            try:
                await websocket.send_json(message)
            except Exception:
                pass
