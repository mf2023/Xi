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
System service manager for Xi Studio.

This module provides business logic for system-related operations.
"""

from typing import Dict, Any
from pathlib import Path

from ...core.dc import XiLogger
from ...core.types import XiSystemStats


class SystemManager:
    """
    Manager for system-related operations.
    """
    
    def __init__(self, root_dir: Path):
        """
        Initialize the system manager.
        
        Args:
            root_dir: Working directory
        """
        self.root_dir = root_dir
        self.logger = XiLogger("Xi.Service.System", enable_file=True)
    
    async def get_system_stats(self) -> XiSystemStats:
        """
        Get system statistics.
        
        Returns:
            XiSystemStats object with system information
        """
        try:
            self.logger.info(
                "Getting system stats",
                event="xi.service.system.stats"
            )
            
            # Import here to avoid circular imports
            from ...server.hardware import collect_system_stats
            
            stats = collect_system_stats()
            
            self.logger.info(
                "System stats collected",
                event="xi.service.system.stats_collected"
            )
            
            return stats
            
        except Exception as e:
            self.logger.error(
                f"Failed to get system stats: {e}",
                event="xi.service.system.error"
            )
            # Return an empty XiSystemStats object
            return XiSystemStats(
                cpu_usage=0.0,
                memory_usage=0.0,
                disk_usage=0.0,
                gpu_count=0,
                gpu_usage=[],
                gpu_memory=[],
                qps=0.0,
                uptime=0,
                temperature=0.0
            )
    
    async def get_system_info(self) -> Dict[str, Any]:
        """
        Get system information.
        
        Returns:
            Dictionary with system information
        """
        try:
            self.logger.info(
                "Getting system info",
                event="xi.service.system.info"
            )
            
            import platform
            import os
            
            system_info = {
                "os": platform.system(),
                "os_version": platform.version(),
                "python_version": platform.python_version(),
                "hostname": platform.node(),
                "processor": platform.processor(),
                "cpu_count": os.cpu_count(),
                "working_directory": str(self.root_dir)
            }
            
            self.logger.info(
                "System info collected",
                event="xi.service.system.info_collected"
            )
            
            return system_info
            
        except Exception as e:
            self.logger.error(
                f"Failed to get system info: {e}",
                event="xi.service.system.error"
            )
            return {}
    
    async def get_resource_usage(self) -> Dict[str, Any]:
        """
        Get resource usage information.
        
        Returns:
            Dictionary with resource usage information
        """
        try:
            self.logger.info(
                "Getting resource usage",
                event="xi.service.system.resources"
            )
            
            import psutil
            
            resource_usage = {
                "cpu": psutil.cpu_percent(interval=1),
                "memory": {
                    "total": psutil.virtual_memory().total,
                    "available": psutil.virtual_memory().available,
                    "used": psutil.virtual_memory().used,
                    "percent": psutil.virtual_memory().percent
                },
                "disk": {
                    "total": psutil.disk_usage('/').total,
                    "used": psutil.disk_usage('/').used,
                    "free": psutil.disk_usage('/').free,
                    "percent": psutil.disk_usage('/').percent
                }
            }
            
            self.logger.info(
                "Resource usage collected",
                event="xi.service.system.resources_collected"
            )
            
            return resource_usage
            
        except Exception as e:
            self.logger.error(
                f"Failed to get resource usage: {e}",
                event="xi.service.system.error"
            )
            return {}