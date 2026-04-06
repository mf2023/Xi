/**
 * Copyright © 2026 Wenze Wei. All Rights Reserved.
 *
 * This file is part of Xi.
 * The Xi project belongs to the Dunimd Team.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * You may not use this file except in compliance with the License.
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

"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
  danger?: boolean;
  checked?: boolean;
  onClick?: () => void;
  children?: ContextMenuItem[];
}

interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
  visible: boolean;
}

interface ContextMenuContextType {
  showContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
  hideContextMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export function useContextMenu() {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error("useContextMenu must be used within a ContextMenuProvider");
  }
  return context;
}

interface ContextMenuProviderProps {
  children: ReactNode;
}

function MenuItem({
  item,
  onClick,
  onHover,
  isSubmenuOpen,
}: {
  item: ContextMenuItem;
  onClick: (item: ContextMenuItem) => void;
  onHover?: (item: ContextMenuItem) => void;
  isSubmenuOpen?: boolean;
}) {
  const hasChildren = item.children && item.children.length > 0;

  if (item.divider) {
    return <div className="my-1 h-px bg-border/50" />;
  }

  return (
    <button
      className={`
        w-full flex items-center gap-3 px-3 py-2 text-sm text-left
        transition-colors duration-100
        ${item.disabled
          ? "opacity-50 cursor-not-allowed"
          : item.danger
            ? "text-red-500 hover:bg-red-500/10"
            : "hover:bg-muted/50"
        }
        ${isSubmenuOpen ? "bg-muted/50" : ""}
      `}
      onClick={() => onClick(item)}
      onMouseEnter={() => onHover?.(item)}
      disabled={item.disabled}
    >
      {item.icon && <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>}
      {item.checked !== undefined && (
        <span className="w-4 h-4 flex items-center justify-center">
          {item.checked ? "✓" : ""}
        </span>
      )}
      <span className="flex-1">{item.label}</span>
      {item.shortcut && (
        <span className="text-xs text-muted-foreground">{item.shortcut}</span>
      )}
      {hasChildren && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </button>
  );
}

function SubMenu({
  items,
  parentRect,
  onItemClick,
  onSubmenuEnter,
}: {
  items: ContextMenuItem[];
  parentRect: DOMRect;
  onItemClick: (item: ContextMenuItem) => void;
  onSubmenuEnter?: () => void;
}) {
  const submenuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (submenuRef.current) {
      const rect = submenuRef.current.getBoundingClientRect();
      let left = parentRect.right;
      let top = parentRect.top;

      if (left + rect.width > window.innerWidth) {
        left = parentRect.left - rect.width;
      }
      if (top + rect.height > window.innerHeight) {
        top = window.innerHeight - rect.height;
      }

      setPosition({ left, top });
    }
  }, [parentRect]);

  return (
    <div
      ref={submenuRef}
      className="fixed z-[100] min-w-[160px] py-1 bg-popover border border-border rounded-md shadow-lg"
      style={{ left: position.left, top: position.top }}
      onMouseEnter={onSubmenuEnter}
    >
      {items.map((item, index) => (
        <MenuItem
          key={item.id}
          item={item}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
}

export function ContextMenuProvider({ children }: ContextMenuProviderProps) {
  const [menuState, setMenuState] = useState<ContextMenuState>({
    x: 0,
    y: 0,
    items: [],
    visible: false,
  });
  const [openSubmenu, setOpenSubmenu] = useState<{ item: ContextMenuItem; rect: DOMRect } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const showContextMenu = useCallback((x: number, y: number, items: ContextMenuItem[]) => {
    setMenuState({ x, y, items, visible: true });
    setOpenSubmenu(null);
  }, []);

  const hideContextMenu = useCallback(() => {
    setMenuState((prev) => ({ ...prev, visible: false }));
    setOpenSubmenu(null);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        hideContextMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        hideContextMenu();
      }
    };

    if (menuState.visible) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuState.visible, hideContextMenu]);

  const handleItemClick = useCallback((item: ContextMenuItem) => {
    if (item.disabled) return;
    if (item.children && item.children.length > 0) {
      return;
    }
    hideContextMenu();
    item.onClick?.();
  }, [hideContextMenu]);

  const handleItemHover = useCallback((item: ContextMenuItem) => {
    if (item.children && item.children.length > 0) {
      const button = itemRefs.current.get(item.id);
      if (button) {
        setOpenSubmenu({ item, rect: button.getBoundingClientRect() });
      }
    }
  }, []);

  const handleMenuLeave = useCallback(() => {
    setOpenSubmenu(null);
  }, []);

  return (
    <ContextMenuContext.Provider value={{ showContextMenu, hideContextMenu }}>
      {children}
      {menuState.visible && (
        <div ref={containerRef} onMouseLeave={handleMenuLeave}>
          <div
            ref={menuRef}
            className="fixed z-[99] min-w-[200px] py-1 bg-popover border border-border rounded-md shadow-lg"
            style={{
              left: Math.min(menuState.x, window.innerWidth - 220),
              top: Math.min(menuState.y, window.innerHeight - (menuState.items.length * 36 + 16)),
            }}
          >
            {menuState.items.map((item, index) => (
              <div
                key={item.id}
                ref={(el) => {
                  if (el) itemRefs.current.set(item.id, el);
                }}
              >
                <MenuItem
                  item={item}
                  onClick={handleItemClick}
                  onHover={handleItemHover}
                  isSubmenuOpen={openSubmenu?.item.id === item.id}
                />
              </div>
            ))}
          </div>
          {openSubmenu && (
            <SubMenu
              items={openSubmenu.item.children || []}
              parentRect={openSubmenu.rect}
              onItemClick={handleItemClick}
              onSubmenuEnter={() => {}}
            />
          )}
        </div>
      )}
    </ContextMenuContext.Provider>
  );
}
