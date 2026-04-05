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

from .xsc.app import XiServer, main as app_main
from .xsc.core.dc import XiLogger
from .xsc.config import XiConfigLoader
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
        # Default behavior: start both backend and frontend
        import subprocess
        import signal
        import time
        
        root_dir = XiConfigLoader.find_project_root()
        logger = XiLogger("Xi.Launcher", enable_file=True)
        processes = []
        
        def signal_handler(signum, frame):
            logger.info(
                f"Received signal {signum}, initiating shutdown...",
                event="xi.launcher.signal"
            )
            cleanup_processes(processes, 3140, 3000, logger)
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # Start backend
        backend_cmd = [sys.executable, __file__, "backend", "--port", "3140"]
        backend_proc = subprocess.Popen(backend_cmd, cwd=str(root_dir))
        processes.append(backend_proc)
        
        # Wait a bit for backend to start
        time.sleep(2)
        
        # Start frontend
        frontend_cmd = [sys.executable, __file__, "frontend", "--frontend-port", "3000"]
        frontend_proc = subprocess.Popen(frontend_cmd, cwd=str(root_dir))
        processes.append(frontend_proc)
        
        print(f"\n{'='*60}")
        print(f"  Xi Studio")
        print(f"{'='*60}")
        print(f"  Backend API:  http://127.0.0.1:3140")
        print(f"  API Docs:     http://127.0.0.1:3140/docs")
        print(f"  Frontend:     http://127.0.0.1:3000")
        print(f"{'='*60}\n")
        print("[INFO] Press Ctrl+C to stop Xi Studio\n")
        
        try:
            for proc in processes:
                proc.wait()
        except KeyboardInterrupt:
            print("\n[INFO] Shutting down Xi Studio...")
        
        cleanup_processes(processes, 3140, 3000, logger)
        sys.exit(0)

    if args.command == "start":
        # Start both backend and frontend
        import subprocess
        import signal
        import time
        
        root_dir = XiConfigLoader.find_project_root()
        logger = XiLogger("Xi.Launcher", enable_file=True)
        processes = []
        
        def signal_handler(signum, frame):
            logger.info(
                f"Received signal {signum}, initiating shutdown...",
                event="xi.launcher.signal"
            )
            cleanup_processes(processes, args.port, args.frontend_port, logger)
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # Start backend
        backend_cmd = [sys.executable, __file__, "backend", "--port", str(args.port)]
        backend_proc = subprocess.Popen(backend_cmd, cwd=str(root_dir))
        processes.append(backend_proc)
        
        # Wait a bit for backend to start
        time.sleep(2)
        
        # Start frontend
        frontend_cmd = [sys.executable, __file__, "frontend", "--frontend-port", str(args.frontend_port)]
        frontend_proc = subprocess.Popen(frontend_cmd, cwd=str(root_dir))
        processes.append(frontend_proc)
        
        print(f"\n{'='*60}")
        print(f"  Xi Studio")
        print(f"{'='*60}")
        print(f"  Backend API:  http://127.0.0.1:{args.port}")
        print(f"  API Docs:     http://127.0.0.1:{args.port}/docs")
        print(f"  Frontend:     http://127.0.0.1:{args.frontend_port}")
        print(f"{'='*60}\n")
        print("[INFO] Press Ctrl+C to stop Xi Studio\n")
        
        try:
            for proc in processes:
                proc.wait()
        except KeyboardInterrupt:
            print("\n[INFO] Shutting down Xi Studio...")
        
        cleanup_processes(processes, args.port, args.frontend_port, logger)
        sys.exit(0)
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
    
    def signal_handler(signum, frame):
        logger.info(
            f"Received signal {signum}, initiating shutdown...",
            event="xi.backend.signal"
        )
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print(f"\n{'='*60}")
    print(f"  Xi Backend Server")
    print(f"{'='*60}")
    print(f"  Backend API:  http://127.0.0.1:{port}")
    print(f"  API Docs:     http://127.0.0.1:{port}/docs")
    print(f"{'='*60}\n")
    
    try:
        # Create and run the server
        server = XiServer(port=port, root_dir=str(root_dir))
        print("\n[INFO] Press Ctrl+C to stop Xi Backend\n")
        server.run(host="127.0.0.1")
    except KeyboardInterrupt:
        print("\n[INFO] Shutting down Xi Backend...")
    except Exception as e:
        logger.error(
            f"Backend failed to start: {e}",
            event="xi.backend.error"
        )
        return 1
    
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
