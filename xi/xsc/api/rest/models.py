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
Models REST API endpoints.
"""

from typing import Dict

from fastapi import FastAPI

from ...core.dc import XiLogger
from ...service import ModelsManager


def setup_models_routes(app: FastAPI, models_manager: ModelsManager, logger: XiLogger, request_count: Dict[str, int]) -> None:
    """
    Setup models routes.
    
    Args:
        app: FastAPI application
        models_manager: ModelsManager instance
        logger: XiLogger instance
        request_count: Mutable request count reference
    """
    @app.get("/v1/models")
    async def list_models():
        request_count["value"] = request_count.get("value", 0) + 1
        models = await models_manager.list_models()
        return {
            "models": models,
            "total": len(models)
        }
    
    @app.get("/v1/models/{model_id}")
    async def get_model(model_id: str):
        request_count["value"] = request_count.get("value", 0) + 1
        model_info = await models_manager.get_model_info(model_id)
        if not model_info:
            return {
                "success": False,
                "error": "Model not found"
            }
        return {
            "success": True,
            "model": model_info
        }
    
    @app.post("/v1/models")
    async def create_model(request: dict):
        request_count["value"] = request_count.get("value", 0) + 1
        response = await models_manager.create_model(request)
        return response.__dict__