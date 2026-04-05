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
Paths configuration schema.
"""

from dataclasses import dataclass, field
from typing import Dict


@dataclass
class XiRunFilesConfig:
    """
    Run files configuration.
    
    Defines the file names used for run state persistence.
    
    Attributes:
        spec: Run specification file name
        state: Run state file name
        events: Events log file name
        metrics: Metrics log file name
        control: Control commands file name
        stdout: Standard output log file name
        artifacts: Artifacts file name
        lock: Lock file name
    """
    spec: str = "spec.json"
    state: str = "state.json"
    events: str = "events.jsonl"
    metrics: str = "metrics.jsonl"
    control: str = "control.jsonl"
    stdout: str = "stdout.log"
    artifacts: str = "artifacts.json"
    lock: str = ".lock"


@dataclass
class XiPathsConfig:
    """
    Path configuration for project directories.
    
    All paths can be relative to project root or absolute.
    Variable substitution is supported: ${paths.xxx}, ${project.name}
    
    Attributes:
        root: Project root directory (usually ".")
        models: Directory for model files
        checkpoints: Directory for training checkpoints
        data: Directory for datasets
        outputs: Directory for output files
        logs: Directory for log files
        cache: Directory for cache files
        temp: Directory for temporary files
        configs: Directory for configuration files
        runs: Directory for run persistence data
        run_files: Run files naming configuration
    """
    root: str = "."
    models: str = ".pisceslx/models"
    checkpoints: str = ".pisceslx/checkpoints"
    data: str = ".pisceslx/data"
    outputs: str = ".pisceslx/outputs"
    logs: str = ".pisceslx/logs"
    cache: str = ".pisceslx/cache"
    temp: str = ".pisceslx/temp"
    configs: str = "configs"
    runs: str = ".pisceslx/runs"
    run_files: XiRunFilesConfig = field(default_factory=XiRunFilesConfig)
