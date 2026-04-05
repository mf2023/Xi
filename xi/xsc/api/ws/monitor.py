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
System monitoring WebSocket endpoints.
"""

import asyncio
from typing import Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from ...core.dc import XiLogger
from ...service import SystemManager


def setup_monitor_websocket(app: FastAPI, system_manager: SystemManager, logger: XiLogger) -> None:
    """
    Setup system monitoring WebSocket endpoints.
    
    Args:
        app: FastAPI application
        system_manager: SystemManager instance
        logger: XiLogger instance
    """
    @app.websocket("/ws/monitor")
    async def websocket_monitor(websocket: WebSocket):
        await websocket.accept()
        try:
            logger.info(
                "WebSocket connected for system monitoring",
                event="xi.ws.monitor.connect"
            )
            
            while True:
                stats = await system_manager.get_system_stats()
                await websocket.send_json({
                    "type": "stats",
                    "data": {
                        "cpu_usage": stats.cpu_usage,
                        "memory_usage": stats.memory_usage,
                        "disk_usage": stats.disk_usage,
                        "gpu_count": stats.gpu_count,
                        "gpu_usage": stats.gpu_usage,
                        "gpu_memory": stats.gpu_memory,
                        "qps": stats.qps,
                        "uptime": stats.uptime,
                        "temperature": stats.temperature
                    }
                })
                await asyncio.sleep(1)  # Send updates every second
                
        except WebSocketDisconnect:
            logger.info(
                "WebSocket disconnected for system monitoring",
                event="xi.ws.monitor.disconnect"
            )
        except Exception as e:
            logger.error(
                f"WebSocket error for system monitoring: {e}",
                event="xi.ws.monitor.error"
            )
            await websocket.close(code=1011, reason=str(e))