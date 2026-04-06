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

import { create } from "zustand";

interface InferenceState {
  sidebarCollapsed: boolean;
  navLocked: boolean;
  wasLockedBeforeLeave: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  enterInference: () => void;
  leaveInference: () => void;
}

export const useInferenceStore = create<InferenceState>((set, get) => ({
  sidebarCollapsed: false,
  navLocked: false,
  wasLockedBeforeLeave: false,
  
  toggleSidebar: () => set((state) => ({ 
    sidebarCollapsed: !state.sidebarCollapsed,
    navLocked: !state.sidebarCollapsed
  })),
  
  setSidebarCollapsed: (collapsed) => set({ 
    sidebarCollapsed: collapsed,
    navLocked: collapsed
  }),

  enterInference: () => {
    const { wasLockedBeforeLeave } = get();
    if (wasLockedBeforeLeave) {
      set({
        sidebarCollapsed: true,
        navLocked: true
      });
    }
  },

  leaveInference: () => {
    const { navLocked } = get();
    set({
      wasLockedBeforeLeave: navLocked,
      navLocked: false
    });
  },
}));
