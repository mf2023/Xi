#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Copyright © 2026 Dunimd Team. All Rights Reserved.
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
Xi - Unified Python Package

Xi is a flagship-grade LLM training and inference workstation
built on the PiscesL1 architecture.
"""

from .xsc import (
    XiLogger,
    XiLogLevel,
    XiErrorCode,
    XiErrorContext,
    XiError,
    XiCommand,
    XiRunStatus,
    XiGpuVendor,
    XiGpuInfo,
    XiRequest,
    XiResponse,
    XiRunInfo,
    XiSystemStats,
    XiLogEntry,
    XiControlRequest,
    XiControlResponse,
    XiConfig,
    XiProjectConfig,
    XiPathsConfig,
    XiApiConfig,
    XiUiConfig,
    XiNotificationConfig,
    XiEnvironmentConfig,
    XiCommandConfig,
    XiCommandSchema,
    XiParameterSchema,
    XiTabSchema,
    XiWidgetConfig,
    XiWidgetStyle,
    XiWidgetValidation,
    XiValueMapping,
    XiConfigLoader,
    XiSession,
    XiSessionManager,
    XiNotification,
    XiNotificationManager,
    XiExecutor,
    XiServer,
    XiLauncher,
)

__version__ = "0.1.0"
__author__ = "Dunimd Team"

__all__ = [
    "XiLogger",
    "XiLogLevel",
    "XiErrorCode",
    "XiErrorContext",
    "XiError",
    "XiCommand",
    "XiRunStatus",
    "XiGpuVendor",
    "XiGpuInfo",
    "XiRequest",
    "XiResponse",
    "XiRunInfo",
    "XiSystemStats",
    "XiLogEntry",
    "XiControlRequest",
    "XiControlResponse",
    "XiConfig",
    "XiProjectConfig",
    "XiPathsConfig",
    "XiApiConfig",
    "XiUiConfig",
    "XiNotificationConfig",
    "XiEnvironmentConfig",
    "XiCommandConfig",
    "XiCommandSchema",
    "XiParameterSchema",
    "XiTabSchema",
    "XiWidgetConfig",
    "XiWidgetStyle",
    "XiWidgetValidation",
    "XiValueMapping",
    "XiConfigLoader",
    "XiSession",
    "XiSessionManager",
    "XiNotification",
    "XiNotificationManager",
    "XiExecutor",
    "XiServer",
    "XiLauncher",
]
