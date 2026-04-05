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
FastAPI Server Application for Xi Studio Backend.

This module provides the main FastAPI server that exposes REST and WebSocket
endpoints for the Xi Studio frontend.
"""

import os
import asyncio
from pathlib import Path
from typing import Optional
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from ..core.dc import XiLogger
from .dependencies import get_dependency_container
from ..api import (
    setup_health_routes,
    setup_runs_routes,
    setup_inference_routes,
    setup_models_routes,
    setup_runs_websocket,
    setup_monitor_websocket
)


class XiServer:
    """
    Main FastAPI server for Xi Studio.
    
    This class provides:
    - REST API endpoints for training/inference management
    - WebSocket endpoints for real-time streaming
    - Session and notification management
    - System monitoring
    """
    
    def __init__(self, port: int = 3140, root_dir: Optional[str] = None):
        """
        Initialize the Xi server.
        
        Args:
            port: Server port (default: 3140)
            root_dir: Working directory for command execution
        """
        self.port = port
        if root_dir:
            self.root_dir = Path(root_dir)
        else:
            from ..config import XiConfigLoader
            self.root_dir = XiConfigLoader.find_project_root()
        
        self.logger = XiLogger("Xi.Server", enable_file=True)
        self._start_time = datetime.now()
        self._request_count = {"value": 0}
        
        # Get dependency container
        self.container = get_dependency_container(self.root_dir)
        
        # Get services from container
        self.executor = self.container.get_executor()
        self.session_manager = self.container.get_session_manager()
        self.notification_manager = self.container.get_notification_manager()
        self.training_manager = self.container.get_training_manager()
        self.inference_manager = self.container.get_inference_manager()
        self.models_manager = self.container.get_models_manager()
        self.system_manager = self.container.get_system_manager()
        
        self.app = FastAPI(
            title="Xi Studio API",
            description="Backend API for Xi Studio",
            version="1.0.0",
            docs_url="/docs",
            redoc_url="/redoc"
        )
        
        # Setup CORS middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # In production, replace with specific origins
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Setup routes
        self._setup_routes()
    
    def _setup_routes(self):
        """
        Setup all routes for the Xi server.
        """
        # Setup REST routes
        setup_health_routes(
            self.app, 
            self._start_time, 
            datetime, 
            self._request_count
        )
        
        setup_runs_routes(
            self.app,
            self.training_manager,
            self.inference_manager,
            self.root_dir,
            self.logger,
            self._request_count
        )
        
        setup_inference_routes(
            self.app,
            self.inference_manager,
            self.logger,
            self._request_count
        )
        
        setup_models_routes(
            self.app,
            self.models_manager,
            self.logger,
            self._request_count
        )
        
        # Setup WebSocket routes
        setup_runs_websocket(
            self.app,
            self.executor,
            self.logger
        )
        
        setup_monitor_websocket(
            self.app,
            self.system_manager,
            self.logger
        )
    
    def run(self, host: str = "127.0.0.1") -> None:
        """
        Start the server.
        
        Args:
            host: Server host (default: 127.0.0.1)
        """
        self.logger.info(
            f"Starting Xi server on {host}:{self.port}",
            event="xi.server.start"
        )
        
        uvicorn.run(
            self.app,
            host=host,
            port=self.port,
            log_level="info",
            ws_ping_interval=20,
            ws_ping_timeout=20,
            timeout_keep_alive=5,
            limit_concurrency=100,
            limit_max_requests=1000,
        )


_server_instance: Optional[XiServer] = None


def get_app() -> FastAPI:
    """
    Get the FastAPI application instance.
    
    Returns:
        FastAPI application
    """
    global _server_instance
    if _server_instance is None:
        _server_instance = XiServer()
    return _server_instance.app


app = get_app()