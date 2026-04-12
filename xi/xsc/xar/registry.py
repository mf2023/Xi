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
XAP Registry - Application Package Registry

Scans and manages all XAP (Xi Applicant Packages) applications.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional
import json
import logging

logger = logging.getLogger(__name__)


@dataclass
class XAPPackage:
    id: str
    name: str
    version: str
    icon: str
    description: str
    path: Path
    manifest: dict

    @property
    def ui_path(self) -> Path:
        return self.path / "ui"

    @property
    def logic_path(self) -> Path:
        return self.path / "logic"


class XARRegistry:
    def __init__(self, packages_dir: Path):
        self.packages_dir = packages_dir
        self.packages: Dict[str, XAPPackage] = {}

    def load_all(self) -> List[XAPPackage]:
        if not self.packages_dir.exists():
            logger.warning(f"Packages directory does not exist: {self.packages_dir}")
            return []

        for xap_dir in self.packages_dir.iterdir():
            if not xap_dir.is_dir():
                continue
            manifest_path = xap_dir / "manifest.json"
            if not manifest_path.exists():
                continue

            try:
                manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
                xap = XAPPackage(
                    id=xap_dir.name,
                    name=manifest.get("name", xap_dir.name),
                    version=manifest.get("version", "1.0.0"),
                    icon=manifest.get("icon", "app"),
                    description=manifest.get("description", ""),
                    path=xap_dir,
                    manifest=manifest
                )
                self.packages[xap.id] = xap
                logger.info(f"Loaded XAP: {xap.id} v{xap.version}")
            except Exception as e:
                logger.error(f"Failed to load XAP from {xap_dir}: {e}")

        return list(self.packages.values())

    def get(self, app_id: str) -> Optional[XAPPackage]:
        return self.packages.get(app_id)

    def list(self) -> List[dict]:
        return [
            {
                "id": p.id,
                "name": p.name,
                "version": p.version,
                "icon": p.icon,
                "description": p.description
            }
            for p in self.packages.values()
        ]
