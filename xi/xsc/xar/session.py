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
XAR Session - Application Session Management

Manages application instances and their WebSocket sessions.
"""

from dataclasses import dataclass, field
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket
import logging
import uuid

logger = logging.getLogger(__name__)


@dataclass
class XAPSession:
    session_id: str
    app_id: str
    websocket: WebSocket
    data: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        if not self.session_id:
            self.session_id = str(uuid.uuid4())


class XARSessions:
    def __init__(self):
        self.sessions: Dict[str, XAPSession] = {}
        self.app_sessions: Dict[str, Set[str]] = {}
        self.websocket_sessions: Dict[int, str] = {}

    def create(self, app_id: str, websocket: WebSocket) -> XAPSession:
        session_id = str(uuid.uuid4())
        session = XAPSession(
            session_id=session_id,
            app_id=app_id,
            websocket=websocket
        )
        self.sessions[session_id] = session
        self.websocket_sessions[id(websocket)] = session_id

        if app_id not in self.app_sessions:
            self.app_sessions[app_id] = set()
        self.app_sessions[app_id].add(session_id)

        logger.info(f"Created XAP session: {session_id} for app: {app_id}")
        return session

    def get(self, session_id: str) -> Optional[XAPSession]:
        return self.sessions.get(session_id)

    def get_by_websocket(self, websocket: WebSocket) -> Optional[XAPSession]:
        session_id = self.websocket_sessions.get(id(websocket))
        if session_id:
            return self.sessions.get(session_id)
        return None

    def get_by_app(self, app_id: str) -> Set[XAPSession]:
        session_ids = self.app_sessions.get(app_id, set())
        return {self.sessions[sid] for sid in session_ids if sid in self.sessions}

    def remove(self, session_id: str) -> None:
        session = self.sessions.get(session_id)
        if session:
            self.app_sessions.get(session.app_id, set()).discard(session_id)
            del self.websocket_sessions[id(session.websocket)]
            del self.sessions[session_id]
            logger.info(f"Removed XAP session: {session_id}")

    def remove_by_websocket(self, websocket: WebSocket) -> None:
        session_id = self.websocket_sessions.get(id(websocket))
        if session_id:
            self.remove(session_id)
