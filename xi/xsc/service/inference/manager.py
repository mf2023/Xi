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
Inference service manager for Xi Studio.

This module provides business logic for inference-related operations.
"""

from typing import Optional, Dict, Any, List
from pathlib import Path

from ...core.dc import XiLogger
from ...core.types import XiRequest, XiResponse, XiRunStatus
from ...executor import XiExecutor


class InferenceManager:
    """
    Manager for inference-related operations.
    """
    
    def __init__(self, executor: XiExecutor, root_dir: Path):
        """
        Initialize the inference manager.
        
        Args:
            executor: XiExecutor instance
            root_dir: Working directory
        """
        self.executor = executor
        self.root_dir = root_dir
        self.logger = XiLogger("Xi.Service.Inference", enable_file=True)
    
    async def create_inference_job(self, request: XiRequest) -> XiResponse:
        """
        Create a new inference job.
        
        Args:
            request: Inference request
            
        Returns:
            XiResponse with job information
        """
        try:
            self.logger.info(
                f"Creating inference job: {request.command.value}",
                event="xi.service.inference.create"
            )
            
            response = await self.executor.execute(request)
            
            self.logger.info(
                f"Inference job created: {response.run_id}",
                event="xi.service.inference.created"
            )
            
            return response
            
        except Exception as e:
            self.logger.error(
                f"Failed to create inference job: {e}",
                event="xi.service.inference.error"
            )
            return XiResponse(
                success=False,
                error=str(e)
            )
    
    async def get_inference_status(self, run_id: str) -> Optional[XiRunStatus]:
        """
        Get status of an inference job.
        
        Args:
            run_id: Run identifier
            
        Returns:
            XiRunStatus or None
        """
        return self.executor.get_status(run_id)
    
    async def list_inference_jobs(self) -> Dict[str, XiRunStatus]:
        """
        List all inference jobs.
        
        Returns:
            Dictionary of run_id to status
        """
        return self.executor.list_active_runs()
    
    async def control_inference_job(self, run_id: str, action: str) -> XiResponse:
        """
        Control an inference job.
        
        Args:
            run_id: Run identifier
            action: Control action (pause, resume, cancel, kill)
            
        Returns:
            XiResponse with result
        """
        try:
            self.logger.info(
                f"Controlling inference job {run_id}: {action}",
                event="xi.service.inference.control"
            )
            
            response = await self.executor.control(run_id, action)
            
            self.logger.info(
                f"Inference job {run_id} controlled: {action}",
                event="xi.service.inference.controlled"
            )
            
            return response
            
        except Exception as e:
            self.logger.error(
                f"Failed to control inference job: {e}",
                event="xi.service.inference.control_error"
            )
            return XiResponse(
                success=False,
                error=str(e)
            )