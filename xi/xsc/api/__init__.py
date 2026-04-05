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
Xi API Layer

API layer for Xi Studio, providing REST and WebSocket endpoints.
"""

from .rest.health import setup_health_routes
from .rest.runs import setup_runs_routes
from .rest.inference import setup_inference_routes
from .rest.models import setup_models_routes
from .ws.runs import setup_runs_websocket
from .ws.monitor import setup_monitor_websocket

__all__ = [
    "setup_health_routes",
    "setup_runs_routes",
    "setup_inference_routes",
    "setup_models_routes",
    "setup_runs_websocket",
    "setup_monitor_websocket",
]