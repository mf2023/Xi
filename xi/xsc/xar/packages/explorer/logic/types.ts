export interface FileItem {
  name: string;
  path: string;
  is_dir: boolean;
  size?: number;
  modified?: string;
}

export interface DriveInfo {
  name: string;
  path: string;
  total: number;
  used: number;
  free: number;
}

export interface ExplorerState {
  currentPath: string;
  items: FileItem[];
  drives: DriveInfo[];
  isLoading: boolean;
  isWsConnected: boolean;
  diskInfo: {
    total: number;
    used: number;
    free: number;
  } | null;
  isWindows: boolean;
}

export interface FileOperationResult {
  success: boolean;
  error?: string;
  path?: string;
}

export interface CreateItemOptions {
  path: string;
  isDirectory: boolean;
}

export interface DeleteItemOptions {
  path: string;
  confirm?: boolean;
}

export interface RenameItemOptions {
  oldPath: string;
  newPath: string;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  divider?: boolean;
  disabled?: boolean;
  children?: ContextMenuItem[];
  onClick?: () => void;
}
