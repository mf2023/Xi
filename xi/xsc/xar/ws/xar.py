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
XAR WebSocket Handler - Routes events to backend modules

This handler only performs routing - it does NOT contain business logic.
Business logic is handled by existing backend modules (monitor, explorer, runs, etc.)
"""

from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import WebSocket
import logging

from ..registry import XARRegistry
from ..loader import XAPLoader
from ..session import XARSessions
from ..protocol import XARMessageType, XARErrorCode

logger = logging.getLogger(__name__)


class XARWebSocketHandler:
    def __init__(self, packages_dir: Path, executor=None):
        self.packages_dir = packages_dir
        self.executor = executor
        self.registry = XARRegistry(packages_dir)
        self.registry.load_all()
        self.loader = XAPLoader(self.registry)
        self.sessions = XARSessions()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        logger.info("XAR WebSocket connected")

    def disconnect(self, websocket: WebSocket) -> None:
        self.sessions.remove_by_websocket(websocket)
        logger.info("XAR WebSocket disconnected")

    async def handle(self, websocket: WebSocket, message: dict) -> None:
        msg_type = message.get("type")

        if msg_type == XARMessageType.LIST:
            await self._handle_list(websocket)

        elif msg_type == XARMessageType.LOAD:
            await self._handle_load(websocket, message.get("app"))

        elif msg_type == XARMessageType.EVENT:
            await self._handle_event(websocket, message)

        elif msg_type == XARMessageType.CLOSE:
            await self._handle_close(websocket, message.get("app"))

        else:
            await self._send_error(websocket, XARErrorCode.INVALID_MESSAGE, f"Unknown message type: {msg_type}")

    async def _handle_list(self, ws: WebSocket) -> None:
        apps = self.registry.list()
        await ws.send_json({
            "type": XARMessageType.LIST_RESPONSE,
            "apps": apps
        })
        logger.info(f"Sent app list: {len(apps)} apps")

    async def _handle_load(self, ws: WebSocket, app_id: str) -> None:
        if not app_id:
            await self._send_error(ws, XARErrorCode.INVALID_MESSAGE, "app_id is required")
            return

        package_data = self.loader.load(app_id)
        if not package_data:
            await self._send_error(ws, XARErrorCode.APP_NOT_FOUND, f"App not found: {app_id}")
            return

        self.sessions.create(app_id, ws)

        await ws.send_json({
            "type": XARMessageType.LOAD_SUCCESS,
            "app": app_id,
            "manifest": package_data["manifest"],
            "ui": package_data["ui"],
            "logic": package_data["logic"]
        })

        logger.info(f"Loaded XAP: {app_id}")

    async def _handle_event(self, ws: WebSocket, message: dict) -> None:
        app_id = message.get("app")
        event = message.get("event")
        payload = message.get("payload", {})

        if not app_id or not event:
            await self._send_error(ws, XARErrorCode.INVALID_MESSAGE, "app and event are required")
            return

        result = await self._route_event(ws, app_id, event, payload)

        if result is not None:
            await ws.send_json({
                "type": XARMessageType.EVENT_RESPONSE,
                "app": app_id,
                "event": event,
                "data": result
            })

    async def _route_event(self, ws: WebSocket, app_id: str, event: str, payload: Any) -> Optional[Dict]:
        try:
            if app_id == "inference":
                return await self._handle_inference_event(event, payload)
            elif app_id == "explorer":
                return await self._handle_explorer_event(event, payload)
            elif app_id == "monitor":
                return await self._handle_monitor_event(event, payload)
            elif app_id == "run_orchestrator":
                return await self._handle_orchestrator_event(event, payload)
            else:
                return {"error": f"Unknown app: {app_id}"}
        except Exception as e:
            logger.error(f"Event routing error: {e}")
            return {"error": str(e)}

    async def _handle_inference_event(self, event: str, payload: Any) -> Optional[Dict]:
        if event == "send":
            text = payload.get("text", "")
            if self.executor:
                result = await self.executor.run_inference(text)
                return {"message": {"role": "assistant", "content": result}}
            return {"error": "Executor not available"}
        elif event == "abort":
            if self.executor:
                self.executor.abort_inference()
            return {"type": "aborted"}
        return None

    async def _handle_explorer_event(self, event: str, payload: Any) -> Optional[Dict]:
        if self.executor:
            if event == "list":
                path = payload.get("path", "/")
                return await self.executor.list_directory(path)
            elif event == "read":
                path = payload.get("path")
                return await self.executor.read_file(path)
            elif event == "write":
                path = payload.get("path")
                content = payload.get("content")
                return await self.executor.write_file(path, content)
            elif event == "create":
                path = payload.get("path")
                is_dir = payload.get("is_dir", False)
                return await self.executor.create_item(path, is_dir)
            elif event == "delete":
                path = payload.get("path")
                return await self.executor.delete_item(path)
            elif event == "rename":
                old_path = payload.get("old_path")
                new_path = payload.get("new_path")
                return await self.executor.rename_item(old_path, new_path)
        return {"error": "Executor not available"}

    async def _handle_monitor_event(self, event: str, payload: Any) -> Optional[Dict]:
        if event == "get_stats":
            if self.executor:
                return await self.executor.get_system_stats()
            return {"error": "Executor not available"}
        elif event == "subscribe":
            return {"type": "subscribed"}
        return None

    async def _handle_orchestrator_event(self, event: str, payload: Any) -> Optional[Dict]:
        if self.executor:
            if event == "list_runs":
                return await self.executor.list_runs()
            elif event == "get_run":
                run_id = payload.get("run_id")
                return await self.executor.get_run(run_id)
            elif event == "create_run":
                return await self.executor.create_run(payload)
            elif event == "control_run":
                run_id = payload.get("run_id")
                action = payload.get("action")
                return await self.executor.control_run(run_id, action)
        return {"error": "Executor not available"}

    async def _handle_close(self, ws: WebSocket, app_id: str) -> None:
        self.sessions.remove_by_websocket(ws)
        logger.info(f"Closed app session: {app_id}")

    async def _send_error(self, ws: WebSocket, code: XARErrorCode, message: str) -> None:
        await ws.send_json({
            "type": XARMessageType.ERROR,
            "error": code,
            "message": message
        })
