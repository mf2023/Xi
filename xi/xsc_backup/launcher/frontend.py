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
Frontend startup module for Xi Launcher.
"""

import os
import time
import platform
import subprocess
from pathlib import Path
from typing import Optional

from ..core.dc import XiLogger


def ensure_frontend_ready(frontend_dir: Path, logger: XiLogger) -> bool:
    """
    Ensure frontend dependencies and build are ready.
    
    Args:
        frontend_dir: Path to frontend directory
        logger: XiLogger instance
        
    Returns:
        True if ready, False otherwise
    """
    is_windows = platform.system().lower().startswith("win")
    npm_cmd = "npm.cmd" if is_windows else "npm"
    
    node_modules = frontend_dir / "node_modules"
    next_dir = frontend_dir / ".next"
    
    if not node_modules.exists():
        print("[INFO] Installing frontend dependencies...")
        logger.info(
            "node_modules not found, running npm install",
            event="xi.launcher.npm_install"
        )
        
        install_result = subprocess.run(
            [npm_cmd, "install"],
            cwd=str(frontend_dir),
            capture_output=True,
            text=True
        )
        
        if install_result.returncode != 0:
            logger.error(
                f"npm install failed: {install_result.stderr}",
                event="xi.launcher.npm_install_error"
            )
            print(f"[ERROR] npm install failed: {install_result.stderr}")
            return False
    
    if not next_dir.exists():
        print("[INFO] Building frontend...")
        logger.info(
            ".next not found, running npm run build",
            event="xi.launcher.npm_build"
        )
        
        build_result = subprocess.run(
            [npm_cmd, "run", "build"],
            cwd=str(frontend_dir),
            capture_output=True,
            text=True
        )
        
        if build_result.returncode != 0:
            logger.error(
                f"npm run build failed: {build_result.stderr}",
                event="xi.launcher.npm_build_error"
            )
            print(f"[ERROR] npm run build failed: {build_result.stderr}")
            return False
    
    return True


def start_frontend(
    port: int,
    root_dir: Path,
    logger: XiLogger,
    processes: list
) -> Optional[subprocess.Popen]:
    """
    Start the frontend server.
    
    Args:
        port: Frontend server port
        root_dir: Project root directory
        logger: XiLogger instance
        processes: List to append process to
        
    Returns:
        subprocess.Popen instance or None on failure
    """
    from .process import kill_port_process
    
    is_windows = platform.system().lower().startswith("win")
    npm_cmd = "npm.cmd" if is_windows else "npm"
    
    frontend_dir = root_dir / "xi" / "xis"
    
    if not frontend_dir.exists():
        logger.error(
            f"Frontend directory not found: {frontend_dir}",
            event="xi.launcher.frontend_missing"
        )
        return None
    
    if not ensure_frontend_ready(frontend_dir, logger):
        return None
    
    logger.info(
        f"Starting frontend server on port {port}",
        event="xi.launcher.frontend_start"
    )
    
    kill_port_process(port, logger)
    
    cmd = [npm_cmd, "run", "start"]
    
    try:
        proc = subprocess.Popen(
            cmd,
            cwd=str(frontend_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            env={**os.environ, "PORT": str(port)}
        )
        processes.append(proc)
        
        time.sleep(2)
        
        if proc.poll() is not None:
            output = ""
            try:
                output = proc.stdout.read().decode('utf-8', errors='ignore')
            except Exception:
                pass
            
            logger.error(
                f"Frontend process exited immediately with code {proc.returncode}: {output}",
                event="xi.launcher.frontend_exit"
            )
            print(f"[ERROR] Frontend failed to start: {output}")
            return None
        
        logger.info(
            f"Frontend process started with PID={proc.pid}",
            event="xi.launcher.frontend_pid"
        )
        
        return proc
    except Exception as e:
        logger.error(
            f"Failed to start frontend: {e}",
            event="xi.launcher.frontend_error"
        )
        return None
