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
Dependency injection container for Xi Studio.

This module provides a dependency injection container for managing service instances.
"""

from typing import Dict, Any
from pathlib import Path

from ..core.dc import XiLogger
from ..executor import XiExecutor
from ..session import XiSessionManager, XiNotificationManager
from ..service import TrainingManager, InferenceManager, ModelsManager, SystemManager


class DependencyContainer:
    """
    Dependency injection container for Xi Studio.
    """
    
    def __init__(self, root_dir: Path):
        """
        Initialize the dependency container.
        
        Args:
            root_dir: Working directory
        """
        self.root_dir = root_dir
        self.logger = XiLogger("Xi.App.Dependencies", enable_file=True)
        self._services: Dict[str, Any] = {}
        
        # Initialize core services
        self._initialize_services()
    
    def _initialize_services(self):
        """
        Initialize all services.
        """
        # Initialize executor
        executor = XiExecutor(str(self.root_dir))
        self._services["executor"] = executor
        
        # Initialize session managers
        session_manager = XiSessionManager()
        notification_manager = XiNotificationManager()
        self._services["session_manager"] = session_manager
        self._services["notification_manager"] = notification_manager
        
        # Initialize service managers
        training_manager = TrainingManager(executor, self.root_dir)
        inference_manager = InferenceManager(executor, self.root_dir)
        models_manager = ModelsManager(executor, self.root_dir)
        system_manager = SystemManager(self.root_dir)
        
        self._services["training_manager"] = training_manager
        self._services["inference_manager"] = inference_manager
        self._services["models_manager"] = models_manager
        self._services["system_manager"] = system_manager
        
        self.logger.info(
            "All services initialized",
            event="xi.app.dependencies.initialized"
        )
    
    def get(self, service_name: str) -> Any:
        """
        Get a service instance by name.
        
        Args:
            service_name: Service name
            
        Returns:
            Service instance
        """
        if service_name not in self._services:
            raise ValueError(f"Service {service_name} not found")
        return self._services[service_name]
    
    def get_executor(self) -> XiExecutor:
        """
        Get the XiExecutor instance.
        
        Returns:
            XiExecutor instance
        """
        return self.get("executor")
    
    def get_session_manager(self) -> XiSessionManager:
        """
        Get the XiSessionManager instance.
        
        Returns:
            XiSessionManager instance
        """
        return self.get("session_manager")
    
    def get_notification_manager(self) -> XiNotificationManager:
        """
        Get the XiNotificationManager instance.
        
        Returns:
            XiNotificationManager instance
        """
        return self.get("notification_manager")
    
    def get_training_manager(self) -> TrainingManager:
        """
        Get the TrainingManager instance.
        
        Returns:
            TrainingManager instance
        """
        return self.get("training_manager")
    
    def get_inference_manager(self) -> InferenceManager:
        """
        Get the InferenceManager instance.
        
        Returns:
            InferenceManager instance
        """
        return self.get("inference_manager")
    
    def get_models_manager(self) -> ModelsManager:
        """
        Get the ModelsManager instance.
        
        Returns:
            ModelsManager instance
        """
        return self.get("models_manager")
    
    def get_system_manager(self) -> SystemManager:
        """
        Get the SystemManager instance.
        
        Returns:
            SystemManager instance
        """
        return self.get("system_manager")


# Global dependency container instance
_container: DependencyContainer = None


def get_dependency_container(root_dir: Path = None) -> DependencyContainer:
    """
    Get the global dependency container instance.
    
    Args:
        root_dir: Working directory
        
    Returns:
        DependencyContainer instance
    """
    global _container
    if _container is None:
        if root_dir is None:
            from ..config import XiConfigLoader
            root_dir = XiConfigLoader.find_project_root()
        _container = DependencyContainer(root_dir)
    return _container