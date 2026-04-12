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
XAR (Xi Applicant Runtime) - Application Runtime System

This module provides the runtime infrastructure for dynamically loading
and managing XAP (Xi Applicant Packages) applications.
"""

from .registry import XARRegistry, XAPPackage
from .loader import XAPLoader
from .protocol import XARMessageType, XARErrorCode
from .session import XARSessions, XAPSession
from .ws.xar import XARWebSocketHandler

__version__ = "1.0.0"

__all__ = [
    "XARRegistry",
    "XAPPackage",
    "XAPLoader",
    "XARMessageType",
    "XARErrorCode",
    "XARSessions",
    "XAPSession",
    "XARWebSocketHandler",
]
