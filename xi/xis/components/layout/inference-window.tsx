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

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Plus,
  Search,
  Sparkles,
  ChevronDown,
  Code,
  Image,
  Languages,
  MoreHorizontal,
  MessageSquare,
  Box,
  Wrench,
  FolderPlus,
  User,
  Loader2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApps } from "./apps-context";
import { AppWindow } from "./app-window";
import { useChatStore, useInferenceStore } from "@/lib/stores";
import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";
import { useSidebarCollapse } from "./sidebar-panel";
import { useI18n } from "@/lib/i18n";

interface InferenceWindowProps {
  state: "minimized" | "normal" | "maximized";
}

function MessageItem({ message, isStreaming }: { message: ChatMessage; isStreaming?: boolean }) {
  const { t } = useI18n();
  const isUser = message.role === "user";
  const [showActions, setShowActions] = useState(false);

  const renderContent = () => {
    if (typeof message.content === "string") {
      return message.content;
    }
    return message.content.map((part, idx) => {
      switch (part.type) {
        case "text":
          return <span key={idx}>{part.text}</span>;
        case "image_url":
          return (
            <img
              key={idx}
              src={part.image_url?.url}
              alt={t("inference.image")}
              className="max-w-md rounded-lg mt-2"
            />
          );
        default:
          return null;
      }
    });
  };

  return (
    <div
      className={cn(
        "group relative flex gap-4 py-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
        )}
      >
        {isUser ? (
          <span className="text-sm font-medium">U</span>
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>

      <div className="flex-1 min-w-0 max-w-[calc(100%-48px)]">
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm ml-auto max-w-[80%]"
              : "bg-muted/50 rounded-tl-sm max-w-[85%]"
          )}
        >
          <p className="whitespace-pre-wrap leading-relaxed text-sm">
            {renderContent()}
            {isStreaming && (
              <Loader2 className="inline-block h-4 w-4 animate-spin ml-2" />
            )}
          </p>
        </div>

        {!isUser && !isStreaming && showActions && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatSidebar({ collapsed }: { collapsed: boolean }) {
  const { t } = useI18n();
  const recentChats = [
    "开发大模型训练平台：简化配置...",
    "蒸馏多模态大模型指南",
    "觉醒：撕碎剧本，成为人生主角",
    "热水比冷水先结冰的奥秘",
    "青春向党，担当有我",
    "寒假化学小报制作指南",
    "探讨中国人以责任过日子的方式",
    "https://www.dedao.cn",
    "开发AI引擎Xi：路线图与排期",
    "AI爆发：资本博弈与政府监管",
    "夫唯不争 故天下莫能与之争 ...",
    "就像饥饿的人扑在面包上 ...",
    "有人说，做人不能一味异想天 ...",
    "树库项目的数据存储容量探讨",
    "以「君子役物，小人役于物」为...",
    "bash -c cd /mnt/d/st",
    "额，我想开发一款类似于和平精...",
  ];

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card border-r transition-all duration-300 overflow-hidden",
        collapsed ? "w-0 border-r-0" : "w-64"
      )}
    >
      {!collapsed && (
        <>
          <div className="p-3">
            <Button variant="outline" className="w-full justify-start gap-2 h-9 text-sm">
              <MessageSquare className="h-4 w-4" />
              {t("inference.newChat")}
            </Button>
          </div>

          <div className="px-3 pb-2 space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors">
              <Box className="h-4 w-4 text-muted-foreground" />
              <span>{t("inference.mySpace")}</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span>{t("inference.agents")}</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span>{t("inference.tools")}</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors">
              <FolderPlus className="h-4 w-4 text-muted-foreground" />
              <span>{t("inference.newGroup")}</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{t("inference.mySpace")}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 mt-2">
              {t("inference.recentChats")}
            </div>
            <div className="space-y-0.5">
              {recentChats.map((chat, idx) => (
                <button
                  key={idx}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm text-muted-foreground transition-colors truncate"
                >
                  {chat}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentModel } = useChatStore();

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm font-medium">{currentModel || "Qwen3-Max"}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 rounded-xl border bg-popover shadow-lg p-1 z-50">
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors">
            <div className="font-medium">Qwen3-Max</div>
            <div className="text-xs text-muted-foreground">最强性能，全面领先</div>
          </button>
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors">
            <div className="font-medium">Qwen3-72B</div>
            <div className="text-xs text-muted-foreground">高性能，适合复杂任务</div>
          </button>
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors">
            <div className="font-medium">Qwen3-32B</div>
            <div className="text-xs text-muted-foreground">均衡性能与速度</div>
          </button>
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors">
            <div className="font-medium">Qwen3-7B</div>
            <div className="text-xs text-muted-foreground">快速响应，轻量级</div>
          </button>
        </div>
      )}
    </div>
  );
}

function ToolButton({ icon: Icon, label, active }: { icon: React.ElementType; label: string; active?: boolean }) {
  return (
    <button
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}

export function InferenceWindow({ state }: InferenceWindowProps) {
  const { t } = useI18n();
  const {
    minimizeApp,
    closeApp,
    maximizeApp,
    restoreApp,
    isAppMaximized,
    getAppPosition,
    updateAppPosition,
    getAppSize,
    updateAppSize,
    focusApp,
    isAppFocused,
  } = useApps();

  const savedPosition = getAppPosition("inference");
  const savedSize = getAppSize("inference");
  const maximized = isAppMaximized("inference");
  const focused = isAppFocused("inference");

  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, isLoading, sendMessageStream } = useChatStore();
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebarCollapse(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;

    setInput("");
    setAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    await sendMessageStream(input);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const handleClose = () => {
    closeApp("inference");
  };

  if (state === "minimized") {
    return null;
  }

  return (
    <AppWindow
      appId="inference"
      defaultSize={{ width: 1100, height: 750 }}
      onMinimize={() => minimizeApp("inference")}
      onClose={handleClose}
      savedPosition={savedPosition}
      onPositionChange={(pos) => updateAppPosition("inference", pos)}
      savedSize={savedSize}
      onSizeChange={(size) => updateAppSize("inference", size)}
      isMaximized={maximized}
      onMaximize={() => maximizeApp("inference")}
      onRestore={() => restoreApp("inference")}
      isFocused={focused}
      onFocus={() => focusApp("inference")}
      sidebarCollapsed={sidebarCollapsed}
      onSidebarToggle={toggleSidebar}
    >
      <div className="flex h-full">
        <ChatSidebar collapsed={sidebarCollapsed} />

        <div className="flex-1 flex flex-col min-w-0 bg-background">
          <header className="flex items-center px-4 py-2">
            <ModelSelector />
          </header>

          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4">
              <h1 className="text-2xl font-medium mb-8">👋 {t("inference.hello")}</h1>

              <div className="w-full max-w-2xl">
                <div className="relative rounded-2xl border bg-card shadow-sm">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={t("inference.placeholder")}
                    className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-sm resize-none min-h-[60px] max-h-[200px] p-4 pb-16"
                    rows={2}
                  />

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <button
                        className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <ToolButton icon={Sparkles} label={t("inference.deepThinking")} />
                      <ToolButton icon={Search} label={t("inference.deepResearch")} />
                      <ToolButton icon={Code} label={t("inference.code")} />
                      <ToolButton icon={Image} label={t("inference.aiImage")} />
                      <ToolButton icon={Languages} label={t("inference.translate")} />
                      <ToolButton icon={MoreHorizontal} label={t("inference.more")} />
                    </div>

                    <div className="flex items-center gap-2">
                      {attachments.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {t("inference.attachments", { count: attachments.length })}
                        </span>
                      )}
                      <button
                        className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-full transition-colors",
                          input.trim() || attachments.length > 0
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-muted text-muted-foreground"
                        )}
                        onClick={handleSend}
                        disabled={isLoading || (!input.trim() && attachments.length === 0)}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="max-w-2xl mx-auto px-4 py-6">
                    {messages.map((message, idx) => (
                      <MessageItem
                        key={idx}
                        message={message}
                        isStreaming={
                          isLoading &&
                          idx === messages.length - 1 &&
                          message.role === "assistant"
                        }
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              <div className="border-t bg-background p-4">
                <div className="max-w-2xl mx-auto">
                  <div className="relative rounded-2xl border bg-card shadow-sm">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={t("inference.placeholder")}
                    className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-sm resize-none min-h-[60px] max-h-[200px] p-4 pb-16"
                    rows={2}
                  />

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <ToolButton icon={Sparkles} label={t("inference.deepThinking")} />
                        <ToolButton icon={Search} label={t("inference.deepResearch")} />
                        <ToolButton icon={Code} label={t("inference.code")} />
                        <ToolButton icon={Image} label={t("inference.aiImage")} />
                        <ToolButton icon={Languages} label={t("inference.translate")} />
                        <ToolButton icon={MoreHorizontal} label={t("inference.more")} />
                      </div>

                      <div className="flex items-center gap-2">
                        {attachments.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {t("inference.attachments", { count: attachments.length })}
                          </span>
                        )}
                        <button
                          className={cn(
                            "flex items-center justify-center h-8 w-8 rounded-full transition-colors",
                            input.trim() || attachments.length > 0
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "bg-muted text-muted-foreground"
                          )}
                          onClick={handleSend}
                          disabled={isLoading || (!input.trim() && attachments.length === 0)}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppWindow>
  );
}
