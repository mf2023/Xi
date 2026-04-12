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
XAP Loader - Application Package Loader

Loads UI (TSX) and Logic (TS) source code from XAP packages.
"""

from pathlib import Path
from typing import Optional, Dict
import logging

from .registry import XARRegistry, XAPPackage

logger = logging.getLogger(__name__)


class XAPLoader:
    def __init__(self, registry: XARRegistry):
        self.registry = registry

    def load(self, app_id: str) -> Optional[Dict]:
        xap = self.registry.get(app_id)
        if not xap:
            logger.warning(f"XAP not found: {app_id}")
            return None

        try:
            ui_entry = self._read_file(xap.ui_path / "App.tsx")
            ui_components = self._load_directory(xap.ui_path / "components")
            logic_entry = self._read_file(xap.logic_path / "index.ts")
            logic_modules = self._load_directory(xap.logic_path)

            return {
                "manifest": xap.manifest,
                "ui": {
                    "entry": ui_entry or "",
                    "components": ui_components
                },
                "logic": {
                    "entry": logic_entry or "",
                    "modules": logic_modules
                }
            }
        except Exception as e:
            logger.error(f"Failed to load XAP {app_id}: {e}")
            return None

    def _load_directory(self, directory: Path) -> Dict[str, str]:
        files = {}
        if not directory.exists():
            return files

        for file_path in directory.rglob("*.ts"):
            try:
                relative = file_path.relative_to(directory)
                key = str(relative).replace("\\", "/")
                files[key] = file_path.read_text(encoding="utf-8")
            except Exception as e:
                logger.warning(f"Failed to read {file_path}: {e}")

        for file_path in directory.rglob("*.tsx"):
            try:
                relative = file_path.relative_to(directory)
                key = str(relative).replace("\\", "/")
                files[key] = file_path.read_text(encoding="utf-8")
            except Exception as e:
                logger.warning(f"Failed to read {file_path}: {e}")

        return files

    def _read_file(self, file_path: Path) -> Optional[str]:
        if file_path.exists():
            try:
                return file_path.read_text(encoding="utf-8")
            except Exception as e:
                logger.warning(f"Failed to read {file_path}: {e}")
        return None
