/**
 * Copyright © 2026 Wenze Wei. All Rights Reserved.
 *
 * This file is part of Xi.
 * The Xi project belongs to the Dunimd Team.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export type AppState = "closed" | "minimized" | "normal" | "maximized";

export interface WindowConfig {
  id: string;
  title?: string;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  maximizable?: boolean;
}

export interface AppManifest {
  id: string;
  name: string;
  version: string;
  icon?: string;
  description?: string;
  windows: WindowConfig[];
  permissions?: string[];
}

export interface XARMessage<T = unknown> {
  type: string;
  payload?: T;
  app?: string;
  event?: string;
  data?: unknown;
  error?: string;
}

export interface XARControls {
  Button: React.ComponentType<ButtonProps>;
  Input: React.ComponentType<InputProps>;
  Textarea: React.ComponentType<TextareaProps>;
  Select: React.ComponentType<SelectProps>;
  List: React.ComponentType<ListProps>;
  Tree: React.ComponentType<TreeProps>;
  Scroll: React.ComponentType<ScrollProps>;
  Dialog: React.ComponentType<DialogProps>;
  Tabs: React.ComponentType<TabsProps>;
  Container: React.ComponentType<ContainerProps>;
  Toolbar: React.ComponentType<ToolbarProps>;
  Breadcrumb: React.ComponentType<BreadcrumbProps>;
  Progress: React.ComponentType<ProgressProps>;
  Badge: React.ComponentType<BadgeProps>;
}

export interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "ghost" | "outline" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export interface InputProps {
  value?: string;
  onChange?: (value: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface TextareaProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}

export interface ListProps<T = unknown> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onSelect?: (item: T) => void;
  selected?: T;
  className?: string;
}

export interface TreeProps<T = unknown> {
  data: T[];
  onSelect?: (item: T) => void;
  selected?: unknown;
  level?: number;
  className?: string;
}

export interface ScrollProps {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  className?: string;
}

export interface TabsProps {
  tabs: Array<{ id: string; label: string; content: React.ReactNode }>;
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export interface ContainerProps {
  direction?: "horizontal" | "vertical";
  gap?: number;
  flex?: number | string;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
  children?: React.ReactNode;
  className?: string;
}

export interface ToolbarProps {
  children?: React.ReactNode;
  className?: string;
}

export interface BreadcrumbProps {
  path: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

export interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
}

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}
