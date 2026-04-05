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
Command-line interface for Xi.

Usage:
    xi start                Start Xi Studio (backend + frontend)
    xi backend              Start only the backend server
    xi frontend             Start only the frontend server
    xi --help               Show this help message

For backward compatibility, you can also use the 'xis' command.
"""

import sys
import argparse
from pathlib import Path

from .xsc.launcher import XiLauncher
from .xsc.core.dc import XiLogger
from .xsc.config import XiConfigLoader
from .xsc.launcher.backend import start_backend, wait_for_backend
from .xsc.launcher.frontend import start_frontend
from .xsc.launcher.process import cleanup_processes


def main():
    """
    Main entry point for Xi CLI.
    """
    parser = argparse.ArgumentParser(
        prog="xi",
        description="Xi - LLM one-stop workstation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    xi start                Start Xi Studio with default ports
    xi backend              Start only the backend server
    xi frontend             Start only the frontend server
    xi start --port 8080    Start with custom backend port
    xi backend --port 8080  Start backend with custom port
        """
    )

    parser.add_argument(
        "--version", "-v",
        action="version",
        version="Xi 0.1.0"
    )

    subparsers = parser.add_subparsers(title="Commands", dest="command")

    start_parser = subparsers.add_parser("start", help="Start Xi Studio (backend + frontend)")
    _add_port_args(start_parser)

    backend_parser = subparsers.add_parser("backend", help="Start only the backend server")
    _add_port_args(backend_parser)

    frontend_parser = subparsers.add_parser("frontend", help="Start only the frontend server")
    _add_port_args(frontend_parser, only_frontend=True)

    args = parser.parse_args()

    if not args.command:
        launcher = XiLauncher(
            xi_port=3140,
            frontend_port=3000
        )
        exit_code = launcher.run()
        sys.exit(exit_code)

    if args.command == "start":
        launcher = XiLauncher(
            xi_port=args.port,
            frontend_port=args.frontend_port
        )
        exit_code = launcher.run()
        sys.exit(exit_code)
    elif args.command == "backend":
        exit_code = _run_backend(args.port)
        sys.exit(exit_code)
    elif args.command == "frontend":
        exit_code = _run_frontend(args.frontend_port)
        sys.exit(exit_code)


def _add_port_args(parser, only_frontend=False):
    """Add port arguments to a parser."""
    if not only_frontend:
        parser.add_argument(
            "--port", "-p",
            type=int,
            default=3140,
            help="Backend API port (default: 3140)"
        )
    parser.add_argument(
        "--frontend-port", "-f",
        type=int,
        default=3000,
        help="Frontend port (default: 3000)"
    )


def _run_backend(port: int) -> int:
    """Run only the backend server."""
    import signal
    import time
    
    root_dir = XiConfigLoader.find_project_root()
    logger = XiLogger("Xi.Backend", enable_file=True)
    processes = []
    
    def signal_handler(signum, frame):
        logger.info(
            f"Received signal {signum}, initiating shutdown...",
            event="xi.backend.signal"
        )
        cleanup_processes(processes, port, None, logger)
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print(f"\n{'='*60}")
    print(f"  Xi Backend Server")
    print(f"{'='*60}")
    print(f"  Backend API:  http://127.0.0.1:{port}")
    print(f"  API Docs:     http://127.0.0.1:{port}/docs")
    print(f"{'='*60}\n")
    
    backend_proc = start_backend(port, root_dir, logger, processes)
    if not backend_proc:
        cleanup_processes(processes, port, None, logger)
        return 1
    
    if not wait_for_backend(port, logger=logger):
        cleanup_processes(processes, port, None, logger)
        return 1
    
    print("\n[INFO] Press Ctrl+C to stop Xi Backend\n")
    
    try:
        while True:
            if backend_proc.poll() is not None:
                logger.info(
                    f"Backend process PID={backend_proc.pid} exited with code {backend_proc.returncode}",
                    event="xi.backend.process_exit"
                )
                cleanup_processes(processes, port, None, logger)
                return backend_proc.returncode or 0
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n[INFO] Shutting down Xi Backend...")
    
    cleanup_processes(processes, port, None, logger)
    return 0


def _run_frontend(frontend_port: int) -> int:
    """Run only the frontend server."""
    import signal
    import time
    
    root_dir = XiConfigLoader.find_project_root()
    logger = XiLogger("Xi.Frontend", enable_file=True)
    processes = []
    
    def signal_handler(signum, frame):
        logger.info(
            f"Received signal {signum}, initiating shutdown...",
            event="xi.frontend.signal"
        )
        cleanup_processes(processes, None, frontend_port, logger)
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print(f"\n{'='*60}")
    print(f"  Xi Frontend Server")
    print(f"{'='*60}")
    print(f"  Frontend:     http://127.0.0.1:{frontend_port}")
    print(f"{'='*60}\n")
    
    frontend_proc = start_frontend(frontend_port, root_dir, logger, processes)
    if not frontend_proc:
        cleanup_processes(processes, None, frontend_port, logger)
        return 1
    
    print("\n[INFO] Press Ctrl+C to stop Xi Frontend\n")
    
    try:
        while True:
            if frontend_proc.poll() is not None:
                logger.info(
                    f"Frontend process PID={frontend_proc.pid} exited with code {frontend_proc.returncode}",
                    event="xi.frontend.process_exit"
                )
                cleanup_processes(processes, None, frontend_port, logger)
                return frontend_proc.returncode or 0
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n[INFO] Shutting down Xi Frontend...")
    
    cleanup_processes(processes, None, frontend_port, logger)
    return 0


if __name__ == "__main__":
    main()
