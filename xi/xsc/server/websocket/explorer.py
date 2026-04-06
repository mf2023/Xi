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
Explorer WebSocket handler for file system operations.
"""

import os
import asyncio
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, Set, Any, Optional, List
from fastapi import WebSocket, WebSocketDisconnect

from ...core.dc import XiLogger


class XiExplorerWebSocket:
    """
    WebSocket handler for file system explorer with real-time operations.
    """
    
    _instance: Optional['XiExplorerWebSocket'] = None
    
    @classmethod
    def get_instance(cls, root_dir: str, logger: XiLogger) -> 'XiExplorerWebSocket':
        """Get or create the global explorer WebSocket handler instance."""
        if cls._instance is None:
            cls._instance = cls(root_dir, logger)
        return cls._instance

    def __init__(self, root_dir: str, logger: XiLogger):
        self.root_dir = Path(root_dir)
        self.logger = logger
        self.active_connections: Set[WebSocket] = set()
        self.is_windows = os.name == "nt"

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.add(websocket)
        self.logger.info(
            f"Explorer WebSocket connected. Total clients: {len(self.active_connections)}",
            event="xi.explorer_ws.connect"
        )

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.discard(websocket)
        self.logger.info(
            f"Explorer WebSocket disconnected. Total clients: {len(self.active_connections)}",
            event="xi.explorer_ws.disconnect"
        )

    async def handle_message(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        msg_type = data.get("type")

        handlers = {
            "get_drives": self._handle_get_drives,
            "browse": self._handle_browse,
            "create_folder": self._handle_create_folder,
            "create_file": self._handle_create_file,
            "delete": self._handle_delete,
            "rename": self._handle_rename,
            "copy": self._handle_copy,
            "move": self._handle_move,
        }

        handler = handlers.get(msg_type)
        if handler:
            await handler(websocket, data)
        else:
            await websocket.send_json({
                "type": "error",
                "message": f"Unknown message type: {msg_type}"
            })

    def _normalize_path(self, path: str) -> str:
        """Normalize path for cross-platform compatibility."""
        if not path or path == "/" or path == "":
            if self.is_windows:
                return str(self.root_dir)
            return "/"
        
        if self.is_windows:
            if len(path) == 2 and path[1] == ":":
                return path + "\\"
            if path.startswith("/") and len(path) > 2 and path[2] == "/":
                return path[1:2] + ":" + path[2:]
        
        return os.path.normpath(path)

    def _get_file_info(self, path: Path) -> Dict[str, Any]:
        """Get file/directory information."""
        try:
            stat = path.stat()
            return {
                "name": path.name,
                "path": str(path).replace("\\", "/"),
                "is_dir": path.is_dir(),
                "size": stat.st_size if path.is_file() else 0,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            }
        except Exception as e:
            return {
                "name": path.name,
                "path": str(path).replace("\\", "/"),
                "is_dir": False,
                "size": 0,
                "error": str(e),
            }

    def _get_volume_label(self, drive: str) -> str:
        """Get volume label for a drive on Windows."""
        if not self.is_windows:
            return ""
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            volume_name = ctypes.create_unicode_buffer(1024)
            file_system_name = ctypes.create_unicode_buffer(1024)
            serial_number = ctypes.c_ulong(0)
            max_component_length = ctypes.c_ulong(0)
            file_system_flags = ctypes.c_ulong(0)
            
            result = kernel32.GetVolumeInformationW(
                ctypes.c_wchar_p(drive),
                volume_name,
                ctypes.sizeof(volume_name) // 2,
                ctypes.byref(serial_number),
                ctypes.byref(max_component_length),
                ctypes.byref(file_system_flags),
                file_system_name,
                ctypes.sizeof(file_system_name) // 2
            )
            
            if result and volume_name.value:
                return volume_name.value
        except Exception:
            pass
        return None

    def _get_default_drive_name(self) -> str:
        """Get default drive name based on system language."""
        try:
            import locale
            lang = locale.getdefaultlocale()[0]
            if lang and lang.startswith(('zh', 'chinese')):
                return "本地磁盘"
        except Exception:
            pass
        return "Local Disk"

    async def _handle_get_drives(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        """Get list of available drives (Windows) or mount points (Unix)."""
        drives = []
        
        if self.is_windows:
            import string
            default_name = self._get_default_drive_name()
            for letter in string.ascii_uppercase:
                drive = f"{letter}:\\"
                if os.path.exists(drive):
                    try:
                        usage = shutil.disk_usage(drive)
                        volume_label = self._get_volume_label(drive)
                        if volume_label is None:
                            display_name = f"{default_name} ({letter}:)"
                        else:
                            display_name = f"{volume_label} ({letter}:)" if volume_label else f"({letter}:)"
                        drives.append({
                            "name": display_name,
                            "path": drive,
                            "total": usage.total,
                            "used": usage.used,
                            "free": usage.free,
                        })
                    except Exception:
                        drives.append({
                            "name": f"{default_name} ({letter}:)",
                            "path": drive,
                            "total": 0,
                            "used": 0,
                            "free": 0,
                        })
        else:
            common_mounts = ["/", "/home", "/mnt", "/media", "/opt", "/var"]
            for mount in common_mounts:
                if os.path.exists(mount):
                    try:
                        usage = shutil.disk_usage(mount)
                        drives.append({
                            "name": mount,
                            "path": mount,
                            "total": usage.total,
                            "used": usage.used,
                            "free": usage.free,
                        })
                    except Exception:
                        pass
        
        await websocket.send_json({
            "type": "drives",
            "is_windows": self.is_windows,
            "drives": drives,
        })

    async def _handle_browse(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        """Browse a directory and return its contents."""
        path_str = data.get("path", "/" if not self.is_windows else str(self.root_dir))
        
        try:
            target_path = self._normalize_path(path_str)
            
            if not os.path.exists(target_path):
                await websocket.send_json({
                    "type": "error",
                    "message": f"Path not found: {path_str}"
                })
                return

            if not os.path.isdir(target_path):
                await websocket.send_json({
                    "type": "error",
                    "message": f"Not a directory: {path_str}"
                })
                return

            def scan_directory(dir_path: str) -> List[Dict[str, Any]]:
                items = []
                try:
                    entries = os.listdir(dir_path)
                except PermissionError:
                    return items
                except Exception:
                    return items
                
                for item in entries:
                    try:
                        item_path = os.path.join(dir_path, item)
                        stat = os.stat(item_path)
                        items.append({
                            "name": item,
                            "path": item_path.replace("\\", "/"),
                            "is_dir": os.path.isdir(item_path),
                            "size": stat.st_size if os.path.isfile(item_path) else 0,
                            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        })
                    except PermissionError:
                        continue
                    except Exception:
                        continue
                
                items.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))
                return items
            
            items = await asyncio.get_event_loop().run_in_executor(
                None, scan_directory, target_path
            )
            
            def get_disk_usage(dir_path: str):
                try:
                    usage = shutil.disk_usage(dir_path)
                    return {
                        "total": usage.total,
                        "used": usage.used,
                        "free": usage.free,
                    }
                except Exception:
                    return None
            
            disk_info = await asyncio.get_event_loop().run_in_executor(
                None, get_disk_usage, target_path
            )

            await websocket.send_json({
                "type": "directory",
                "path": target_path.replace("\\", "/"),
                "items": items,
                "disk": disk_info,
                "is_windows": self.is_windows,
            })

        except Exception as e:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })

    async def _handle_create_folder(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        path_str = data.get("path")
        
        if not path_str:
            await websocket.send_json({
                "type": "error",
                "message": "path is required"
            })
            return

        try:
            target_path = self._normalize_path(path_str)
            os.makedirs(target_path, exist_ok=True)
            
            await websocket.send_json({
                "type": "operation_result",
                "success": True,
                "operation": "create_folder",
                "path": path_str,
            })

        except Exception as e:
            await websocket.send_json({
                "type": "operation_result",
                "success": False,
                "error": str(e)
            })

    async def _handle_create_file(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        path_str = data.get("path")
        content = data.get("content", "")
        
        if not path_str:
            await websocket.send_json({
                "type": "error",
                "message": "path is required"
            })
            return

        try:
            target_path = self._normalize_path(path_str)
            parent_dir = os.path.dirname(target_path)
            if parent_dir:
                os.makedirs(parent_dir, exist_ok=True)
            
            with open(target_path, "w", encoding="utf-8") as f:
                f.write(content)
            
            await websocket.send_json({
                "type": "operation_result",
                "success": True,
                "operation": "create_file",
                "path": path_str,
            })

        except Exception as e:
            await websocket.send_json({
                "type": "operation_result",
                "success": False,
                "error": str(e)
            })

    async def _handle_delete(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        path_str = data.get("path")
        
        if not path_str:
            await websocket.send_json({
                "type": "error",
                "message": "path is required"
            })
            return

        try:
            target_path = self._normalize_path(path_str)
            
            if os.path.isdir(target_path):
                shutil.rmtree(target_path)
            else:
                os.remove(target_path)
            
            await websocket.send_json({
                "type": "operation_result",
                "success": True,
                "operation": "delete",
                "path": path_str,
            })

        except Exception as e:
            await websocket.send_json({
                "type": "operation_result",
                "success": False,
                "error": str(e)
            })

    async def _handle_rename(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        old_path_str = data.get("old_path")
        new_path_str = data.get("new_path")
        
        if not old_path_str or not new_path_str:
            await websocket.send_json({
                "type": "error",
                "message": "old_path and new_path are required"
            })
            return

        try:
            old_path = self._normalize_path(old_path_str)
            new_path = self._normalize_path(new_path_str)
            
            os.rename(old_path, new_path)
            
            await websocket.send_json({
                "type": "operation_result",
                "success": True,
                "operation": "rename",
                "old_path": old_path_str,
                "new_path": new_path_str,
            })

        except Exception as e:
            await websocket.send_json({
                "type": "operation_result",
                "success": False,
                "error": str(e)
            })

    async def _handle_copy(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        source_str = data.get("source")
        dest_str = data.get("destination")
        
        if not source_str or not dest_str:
            await websocket.send_json({
                "type": "error",
                "message": "source and destination are required"
            })
            return

        try:
            source_path = self._normalize_path(source_str)
            dest_path = self._normalize_path(dest_str)
            
            if os.path.isdir(source_path):
                shutil.copytree(source_path, dest_path)
            else:
                shutil.copy2(source_path, dest_path)
            
            await websocket.send_json({
                "type": "operation_result",
                "success": True,
                "operation": "copy",
                "source": source_str,
                "destination": dest_str,
            })

        except Exception as e:
            await websocket.send_json({
                "type": "operation_result",
                "success": False,
                "error": str(e)
            })

    async def _handle_move(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        source_str = data.get("source")
        dest_str = data.get("destination")
        
        if not source_str or not dest_str:
            await websocket.send_json({
                "type": "error",
                "message": "source and destination are required"
            })
            return

        try:
            source_path = self._normalize_path(source_str)
            dest_path = self._normalize_path(dest_str)
            
            shutil.move(source_path, dest_path)
            
            await websocket.send_json({
                "type": "operation_result",
                "success": True,
                "operation": "move",
                "source": source_str,
                "destination": dest_str,
            })

        except Exception as e:
            await websocket.send_json({
                "type": "operation_result",
                "success": False,
                "error": str(e)
            })
