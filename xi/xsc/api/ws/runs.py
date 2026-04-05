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
Run management WebSocket endpoints.
"""

from typing import Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from ...core.dc import XiLogger
from ...executor import XiExecutor


def setup_runs_websocket(app: FastAPI, executor: XiExecutor, logger: XiLogger) -> None:
    """
    Setup run management WebSocket endpoints.
    
    Args:
        app: FastAPI application
        executor: XiExecutor instance
        logger: XiLogger instance
    """
    @app.websocket("/ws/runs/{run_id}")
    async def websocket_runs(websocket: WebSocket, run_id: str):
        await websocket.accept()
        try:
            logger.info(
                f"WebSocket connected for run {run_id}",
                event="xi.ws.runs.connect"
            )
            
            async for log_entry in executor.get_output_stream(run_id):
                await websocket.send_json({
                    "type": "log",
                    "data": {
                        "run_id": run_id,
                        "timestamp": log_entry.timestamp.isoformat(),
                        "level": log_entry.level.value,
                        "message": log_entry.message
                    }
                })
                
        except WebSocketDisconnect:
            logger.info(
                f"WebSocket disconnected for run {run_id}",
                event="xi.ws.runs.disconnect"
            )
        except Exception as e:
            logger.error(
                f"WebSocket error for run {run_id}: {e}",
                event="xi.ws.runs.error"
            )
            await websocket.close(code=1011, reason=str(e))