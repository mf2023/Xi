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
import type { XARControls } from "../../../../xar/runtime/controls";
import type { XARBridge } from "../../logic/api";
import type { Message } from "../../logic/types";
import { cn } from "../../../../../../xis/lib/utils";

interface XARControls {
  Button: React.ComponentType<{
    variant?: string;
    size?: string;
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }>;
  Input: React.ComponentType<{
    className?: string;
    placeholder?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
  }>;
  ScrollArea: React.ComponentType<{
    className?: string;
    children: React.ReactNode;
  }>;
}

interface AppProps {
  appId: string;
  controls: XARControls;
  bridge: XARBridge;
}

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  controls: XARControls;
}

function MessageItem({ message, isStreaming, controls }: MessageItemProps) {
  const isUser = message.role === "user";
  const [showActions, setShowActions] = useState(false);

  const Button = controls.Button;

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

      <div className="flex-1 min-w-0 max-w-[calc(100%-48px%)]">
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm ml-auto max-w-[80%]"
              : "bg-muted/50 rounded-tl-sm max-w-[85%]"
          )}
        >
          <p className="whitespace-pre-wrap leading-relaxed text-sm">
            {message.content}
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

interface ChatSidebarProps {
  collapsed: boolean;
  controls: XARControls;
}

function ChatSidebar({ collapsed, controls }: ChatSidebarProps) {
  const Button = controls.Button;
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
              <span>新建对话</span>
            </Button>
          </div>

          <div className="px-3 pb-2 space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors">
              <Box className="h-4 w-4 text-muted-foreground" />
              <span>我的空间</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span>智能体</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span>工具</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors">
              <FolderPlus className="h-4 w-4 text-muted-foreground" />
              <span>新建分组</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>我的空间</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 mt-2">
              最近对话
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

interface ModelSelectorProps {
  controls: XARControls;
}

function ModelSelector({ controls }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState("Qwen3-Max");

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm font-medium">{currentModel}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 rounded-xl border bg-popover shadow-lg p-1 z-50">
          <button
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors"
            onClick={() => { setCurrentModel("Qwen3-Max"); setIsOpen(false); }}
          >
            <div className="font-medium">Qwen3-Max</div>
            <div className="text-xs text-muted-foreground">最强性能，全面领先</div>
          </button>
          <button
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors"
            onClick={() => { setCurrentModel("Qwen3-72B"); setIsOpen(false); }}
          >
            <div className="font-medium">Qwen3-72B</div>
            <div className="text-xs text-muted-foreground">高性能，适合复杂任务</div>
          </button>
          <button
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors"
            onClick={() => { setCurrentModel("Qwen3-32B"); setIsOpen(false); }}
          >
            <div className="font-medium">Qwen3-32B</div>
            <div className="text-xs text-muted-foreground">均衡性能与速度</div>
          </button>
          <button
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors"
            onClick={() => { setCurrentModel("Qwen3-7B"); setIsOpen(false); }}
          >
            <div className="font-medium">Qwen3-7B</div>
            <div className="text-xs text-muted-foreground">快速响应，轻量级</div>
          </button>
        </div>
      )}
    </div>
  );
}

interface ToolButtonProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function ToolButton({ icon: Icon, label, active, onClick }: ToolButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}

export function App({ appId, controls, bridge }: AppProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ScrollArea = controls.ScrollArea;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  useEffect(() => {
    const unsubscribeMessage = bridge.onAppEvent("inference.message", (data) => {
      const msg = data as Message;
      setMessages((prev) => [...prev, msg]);
      setIsLoading(false);
    });

    const unsubscribeStream = bridge.onAppEvent("inference.stream", (data) => {
      const chunk = data as { delta: string };
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: lastMessage.content + chunk.delta }
          ];
        }
        return prev;
      });
    });

    const unsubscribeError = bridge.onAppEvent("inference.error", (data) => {
      console.error("Inference error:", data);
      setIsLoading(false);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeStream();
      unsubscribeError();
    };
  }, [bridge]);

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    bridge.send("inference.send", {
      content: input,
      appId,
      timestamp: Date.now(),
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-full">
      <ChatSidebar collapsed={sidebarCollapsed} controls={controls} />

      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <header className="flex items-center px-4 py-2">
          <ModelSelector controls={controls} />
        </header>

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <h1 className="text-2xl font-medium mb-8">👋 你好，有什么可以帮你的？</h1>

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
                  placeholder="输入你的问题..."
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
                    <ToolButton icon={Sparkles} label="深度思考" />
                    <ToolButton icon={Search} label="深度搜索" />
                    <ToolButton icon={Code} label="代码" />
                    <ToolButton icon={Image} label="AI生图" />
                    <ToolButton icon={Languages} label="翻译" />
                    <ToolButton icon={MoreHorizontal} label="更多" />
                  </div>

                  <div className="flex items-center gap-2">
                    {attachments.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {attachments.length} 个附件
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
                      key={message.id || idx}
                      message={message}
                      isStreaming={
                        isLoading &&
                        idx === messages.length - 1 &&
                        message.role === "assistant"
                      }
                      controls={controls}
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
                    placeholder="输入你的问题..."
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
                      <ToolButton icon={Sparkles} label="深度思考" />
                      <ToolButton icon={Search} label="深度搜索" />
                      <ToolButton icon={Code} label="代码" />
                      <ToolButton icon={Image} label="AI生图" />
                      <ToolButton icon={Languages} label="翻译" />
                      <ToolButton icon={MoreHorizontal} label="更多" />
                    </div>

                    <div className="flex items-center gap-2">
                      {attachments.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {attachments.length} 个附件
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
  );
}

export default App;
