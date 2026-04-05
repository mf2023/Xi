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
Run persistence module for Xi Studio.

Handles saving and loading run state to/from disk for recovery after restart.
Uses configuration file for file naming conventions.
"""

import json
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List

from ..core.dc import XiLogger
from ..config.loader import get_xi_config


class XiRunPersistence:
    """
    Manages run state persistence.
    
    Uses configuration file for:
    - Run directory path: config.paths.runs
    - File names: config.paths.run_files (spec, state, events, etc.)
    """
    
    def __init__(self, root_dir: str = "."):
        self.root_dir = Path(root_dir)
        self.logger = XiLogger("Xi.RunPersistence", enable_file=True)
        self._runs_dir: Optional[Path] = None
        self._run_files: Optional[Dict[str, str]] = None
    
    @property
    def runs_dir(self) -> Path:
        """Get the runs directory path from config, creating it if needed."""
        if self._runs_dir is None:
            config = get_xi_config()
            runs_path = config.paths.runs
            
            if not Path(runs_path).is_absolute():
                self._runs_dir = self.root_dir / runs_path
            else:
                self._runs_dir = Path(runs_path)
            
            self._runs_dir.mkdir(parents=True, exist_ok=True)
        
        return self._runs_dir
    
    @property
    def run_files(self) -> Dict[str, str]:
        """Get run file names from config."""
        if self._run_files is None:
            config = get_xi_config()
            rf = config.paths.run_files
            self._run_files = {
                "spec": rf.spec,
                "state": rf.state,
                "events": rf.events,
                "metrics": rf.metrics,
                "control": rf.control,
                "stdout": rf.stdout,
                "artifacts": rf.artifacts,
                "lock": rf.lock,
            }
        return self._run_files
    
    def save_run(self, run_data: Dict[str, Any]) -> bool:
        """
        Save run data to disk.
        
        Args:
            run_data: Dictionary containing run information
            
        Returns:
            True if saved successfully
        """
        run_id = run_data.get("run_id")
        if not run_id:
            self.logger.warning("Cannot save run without run_id", event="xi.persistence.no_id")
            return False
        
        try:
            run_dir = self.runs_dir / run_id
            run_dir.mkdir(parents=True, exist_ok=True)
            
            run_data["updated_at"] = datetime.now().isoformat()
            
            if "created_at" not in run_data:
                run_data["created_at"] = run_data["updated_at"]
            
            state_file = run_dir / self.run_files["state"]
            with open(state_file, "w", encoding="utf-8") as f:
                json.dump(run_data, f, indent=2, ensure_ascii=False)
            
            self.logger.debug(f"Saved run: {run_id}", event="xi.persistence.saved")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to save run {run_id}: {e}", event="xi.persistence.save_error")
            return False
    
    def load_run(self, run_id: str) -> Optional[Dict[str, Any]]:
        """
        Load run data from disk.
        
        Args:
            run_id: Run identifier
            
        Returns:
            Run data dictionary or None if not found
        """
        try:
            run_dir = self.runs_dir / run_id
            
            if run_dir.is_dir():
                state_file = run_dir / self.run_files["state"]
                spec_file = run_dir / self.run_files["spec"]
                
                run_data = {}
                
                if state_file.exists():
                    with open(state_file, "r", encoding="utf-8") as f:
                        run_data.update(json.load(f))
                
                if spec_file.exists():
                    with open(spec_file, "r", encoding="utf-8") as f:
                        spec = json.load(f)
                        run_data["name"] = spec.get("run_name", run_id)
                        run_data["run_type"] = spec.get("type", "unknown")
                        run_data["command"] = spec.get("type", "unknown")
                        if "args" in spec:
                            run_data["config"] = spec["args"]
                
                if run_data:
                    run_data["run_id"] = run_id
                    return run_data
            
            return None
                
        except Exception as e:
            self.logger.error(f"Failed to load run {run_id}: {e}", event="xi.persistence.load_error")
            return None
    
    def load_all_runs(self) -> List[Dict[str, Any]]:
        """
        Load all run data from disk.
        
        Returns:
            List of run data dictionaries
        """
        runs = []
        
        try:
            if not self.runs_dir.exists():
                return runs
            
            for item in self.runs_dir.iterdir():
                try:
                    if item.is_dir():
                        run_data = self.load_run(item.name)
                        if run_data:
                            runs.append(run_data)
                except Exception as e:
                    self.logger.warning(f"Failed to load {item}: {e}", event="xi.persistence.load_warning")
            
            runs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            
        except Exception as e:
            self.logger.error(f"Failed to load runs: {e}", event="xi.persistence.load_all_error")
        
        return runs
    
    def update_run_status(self, run_id: str, status: str, **extra: Any) -> bool:
        """
        Update run status.
        
        Args:
            run_id: Run identifier
            status: New status value
            **extra: Additional fields to update
            
        Returns:
            True if updated successfully
        """
        run_data = self.load_run(run_id)
        
        if not run_data:
            run_data = {"run_id": run_id}
        
        run_data["status"] = status
        run_data.update(extra)
        
        return self.save_run(run_data)
    
    def delete_run(self, run_id: str) -> bool:
        """
        Delete run data from disk.
        
        Args:
            run_id: Run identifier
            
        Returns:
            True if deleted successfully
        """
        try:
            run_dir = self.runs_dir / run_id
            if run_dir.is_dir():
                shutil.rmtree(run_dir)
                self.logger.debug(f"Deleted run directory: {run_id}", event="xi.persistence.deleted")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to delete run {run_id}: {e}", event="xi.persistence.delete_error")
            return False
    
    def cleanup_old_runs(self, max_age_days: int = 30) -> int:
        """
        Clean up runs older than specified days.
        
        Args:
            max_age_days: Maximum age in days
            
        Returns:
            Number of runs cleaned up
        """
        cleaned = 0
        
        try:
            cutoff = datetime.now().timestamp() - (max_age_days * 86400)
            
            for item in self.runs_dir.iterdir():
                try:
                    if item.stat().st_mtime < cutoff:
                        if item.is_dir():
                            shutil.rmtree(item)
                        else:
                            item.unlink()
                        cleaned += 1
                except Exception:
                    pass
                    
        except Exception as e:
            self.logger.error(f"Failed to cleanup runs: {e}", event="xi.persistence.cleanup_error")
        
        if cleaned > 0:
            self.logger.info(f"Cleaned up {cleaned} old runs", event="xi.persistence.cleaned")
        
        return cleaned


_persistence: Optional[XiRunPersistence] = None


def get_run_persistence(root_dir: str = ".") -> XiRunPersistence:
    """Get the global run persistence instance."""
    global _persistence
    if _persistence is None:
        _persistence = XiRunPersistence(root_dir)
    return _persistence
