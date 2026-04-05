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
Training service manager for Xi Studio.

This module provides business logic for training-related operations.
"""

from typing import Optional, Dict, Any, List
from pathlib import Path

from ...core.dc import XiLogger
from ...core.types import XiRequest, XiResponse, XiRunStatus
from ...executor import XiExecutor


class TrainingManager:
    """
    Manager for training-related operations.
    """
    
    def __init__(self, executor: XiExecutor, root_dir: Path):
        """
        Initialize the training manager.
        
        Args:
            executor: XiExecutor instance
            root_dir: Working directory
        """
        self.executor = executor
        self.root_dir = root_dir
        self.logger = XiLogger("Xi.Service.Training", enable_file=True)
    
    async def create_training_job(self, request: XiRequest) -> XiResponse:
        """
        Create a new training job.
        
        Args:
            request: Training request
            
        Returns:
            XiResponse with job information
        """
        try:
            self.logger.info(
                f"Creating training job: {request.command.value}",
                event="xi.service.training.create"
            )
            
            response = await self.executor.execute(request)
            
            self.logger.info(
                f"Training job created: {response.run_id}",
                event="xi.service.training.created"
            )
            
            return response
            
        except Exception as e:
            self.logger.error(
                f"Failed to create training job: {e}",
                event="xi.service.training.error"
            )
            return XiResponse(
                success=False,
                error=str(e)
            )
    
    async def get_training_status(self, run_id: str) -> Optional[XiRunStatus]:
        """
        Get status of a training job.
        
        Args:
            run_id: Run identifier
            
        Returns:
            XiRunStatus or None
        """
        return self.executor.get_status(run_id)
    
    async def list_training_jobs(self) -> Dict[str, XiRunStatus]:
        """
        List all training jobs.
        
        Returns:
            Dictionary of run_id to status
        """
        return self.executor.list_active_runs()
    
    async def control_training_job(self, run_id: str, action: str) -> XiResponse:
        """
        Control a training job.
        
        Args:
            run_id: Run identifier
            action: Control action (pause, resume, cancel, kill)
            
        Returns:
            XiResponse with result
        """
        try:
            self.logger.info(
                f"Controlling training job {run_id}: {action}",
                event="xi.service.training.control"
            )
            
            response = await self.executor.control(run_id, action)
            
            self.logger.info(
                f"Training job {run_id} controlled: {action}",
                event="xi.service.training.controlled"
            )
            
            return response
            
        except Exception as e:
            self.logger.error(
                f"Failed to control training job: {e}",
                event="xi.service.training.control_error"
            )
            return XiResponse(
                success=False,
                error=str(e)
            )