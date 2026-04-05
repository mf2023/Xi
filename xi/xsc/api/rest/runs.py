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
Run management REST API endpoints.
"""

import os
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

from fastapi import FastAPI, HTTPException

from ...core.types import XiCommand, XiRunStatus
from ...core.dc import XiLogger
from ...config import XiConfigLoader
from ...service import TrainingManager, InferenceManager


def setup_runs_routes(app: FastAPI, training_manager: TrainingManager, inference_manager: InferenceManager, root_dir: Path, logger: XiLogger, request_count: Dict[str, int]) -> None:
    """
    Setup run management routes.
    
    Args:
        app: FastAPI application
        training_manager: TrainingManager instance
        inference_manager: InferenceManager instance
        root_dir: Working directory
        logger: XiLogger instance
        request_count: Mutable request count reference
    """
    @app.get("/v1/runs/types")
    async def get_run_types():
        request_count["value"] = request_count.get("value", 0) + 1
        run_types = XiConfigLoader.load_run_types()
        return {
            "run_types": [rt.to_dict() for rt in run_types],
            "total": len(run_types)
        }
    
    @app.get("/v1/runs")
    async def list_runs():
        request_count["value"] = request_count.get("value", 0) + 1
        runs = await training_manager.list_training_jobs()
        run_list = []
        for run_id, status in runs.items():
            run_list.append({
                    "run_id": run_id,
                    "status": status.value,
                    "created_at": datetime.now().isoformat()
                })
        return {"runs": run_list, "total": len(run_list)}
    
    @app.post("/v1/runs")
    async def create_run(request: dict):
        request_count["value"] = request_count.get("value", 0) + 1
        
        command_name = request.get("command", "train")
        args = request.get("args", {})
        run_id = request.get("run_id")
        run_name = request.get("run_name")
        background = request.get("background", True)
        
        try:
            config = XiConfigLoader.get_xi_config()
            cmd_config = config.commands.get(command_name)
            
            if not cmd_config:
                raise HTTPException(
                    status_code=400,
                    detail=f"Command '{command_name}' not found in configuration"
                )
            
            # Create XiRequest
            from ...core.types import XiRequest
            xi_request = XiRequest(
                command=XiCommand(command_name),
                args=args,
                run_id=run_id,
                background=background
            )
            
            # Use appropriate manager based on command type
            if command_name == "train":
                response = await training_manager.create_training_job(xi_request)
            else:
                response = await inference_manager.create_inference_job(xi_request)
            
            return response.__dict__
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to create run: {e}", event="xi.run.error")
            return {
                "success": False,
                "error": str(e),
            }
    
    @app.get("/v1/runs/{run_id}")
    async def get_run(run_id: str):
        request_count["value"] = request_count.get("value", 0) + 1
        status = await training_manager.get_training_status(run_id)
        if not status:
            status = await inference_manager.get_inference_status(run_id)
        if not status:
            raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
        
        return {
            "run_id": run_id,
            "status": status.value,
            "created_at": datetime.now().isoformat()
        }
    
    @app.post("/v1/runs/{run_id}/control")
    async def control_run(run_id: str, request: dict):
        request_count["value"] = request_count.get("value", 0) + 1
        action = request.get("action")
        if not action:
            raise HTTPException(status_code=400, detail="Action is required")
        
        # Try training manager first
        response = await training_manager.control_training_job(run_id, action)
        if not response.success:
            # Try inference manager
            response = await inference_manager.control_inference_job(run_id, action)
        
        return response.__dict__