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
XAR Protocol - WebSocket Protocol Message Types

Defines all WebSocket message types for XAR communication.
"""

from enum import Enum


class XARMessageType(str, Enum):
    LIST = "xar.list"
    LIST_RESPONSE = "xar.list.response"

    LOAD = "xar.load"
    LOAD_SUCCESS = "xar.load.success"
    LOAD_ERROR = "xar.load.error"

    EVENT = "xar.event"
    EVENT_RESPONSE = "xar.event.response"

    CLOSE = "xar.close"
    ERROR = "xar.error"


class XARErrorCode(str, Enum):
    APP_NOT_FOUND = "app_not_found"
    LOAD_FAILED = "load_failed"
    INVALID_MESSAGE = "invalid_message"
    SESSION_NOT_FOUND = "session_not_found"
    EVENT_ROUTING_FAILED = "event_routing_failed"
