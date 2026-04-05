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
Health check REST API endpoints.
"""

from datetime import datetime
from typing import Dict

from fastapi import FastAPI


def setup_health_routes(app: FastAPI, start_time: datetime, datetime_module, request_count: Dict[str, int]) -> None:
    """
    Setup health check routes.
    
    Args:
        app: FastAPI application
        start_time: Server start time
        datetime_module: datetime module
        request_count: Mutable request count reference
    """
    @app.get("/health")
    async def health_check():
        request_count["value"] = request_count.get("value", 0) + 1
        uptime = (datetime_module.now() - start_time).total_seconds()
        return {
            "status": "healthy",
            "uptime": uptime,
            "timestamp": datetime_module.now().isoformat()
        }
    
    @app.get("/health/metrics")
    async def health_metrics():
        request_count["value"] = request_count.get("value", 0) + 1
        uptime = (datetime_module.now() - start_time).total_seconds()
        return {
            "uptime": uptime,
            "requests": request_count.get("value", 0),
            "timestamp": datetime_module.now().isoformat()
        }