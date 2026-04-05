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
Launcher for Xi Studio application.

This module provides the main entry point for launching the Xi Studio application.
"""

import argparse
import sys
from pathlib import Path

from ..core.dc import XiLogger
from .server import XiServer


def main():
    """
    Main entry point for the Xi Studio application.
    """
    parser = argparse.ArgumentParser(description="Xi Studio - LLM one-stop workstation")
    parser.add_argument(
        "--port",
        type=int,
        default=3140,
        help="Server port (default: 3140)"
    )
    parser.add_argument(
        "--host",
        type=str,
        default="127.0.0.1",
        help="Server host (default: 127.0.0.1)"
    )
    parser.add_argument(
        "--root-dir",
        type=str,
        default=None,
        help="Working directory (default: current directory)"
    )
    
    args = parser.parse_args()
    
    logger = XiLogger("Xi.Launcher", enable_file=True)
    logger.info(
        f"Starting Xi Studio with port={args.port}, host={args.host}",
        event="xi.launcher.start"
    )
    
    try:
        # Create server instance
        server = XiServer(
            port=args.port,
            root_dir=args.root_dir
        )
        
        # Start server
        server.run(host=args.host)
        
    except Exception as e:
        logger.error(
            f"Failed to start Xi Studio: {e}",
            event="xi.launcher.error"
        )
        sys.exit(1)


if __name__ == "__main__":
    main()