import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  AlertTriangle,
  Bot,
  Plug,
  History,
  Kanban,
  ChevronDown,
  Plus,
  Search,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import CommandPalette from "./CommandPalette";

const primaryNav = [
  { icon: LayoutDashboard, label: "Boards", path: "/", shortcut: "⌘1" },
  { icon: AlertTriangle, label: "Triage", path: "/triage", shortcut: "⌘2", hasBadge: true },
  { icon: Bot, label: "Agents", path: "/agents", shortcut: "⌘3" },
  { icon: Plug, label: "Providers", path: "/providers", shortcut: "⌘4" },
  { icon: History, label: "Executions", path: "/executions", shortcut: "⌘5" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return <DashboardLayoutSkeleton />;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent
        setSidebarWidth={setSidebarWidth}
        commandPaletteOpen={commandPaletteOpen}
        setCommandPaletteOpen={setCommandPaletteOpen}
      >
        {children}
      </DashboardLayoutContent>
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  commandPaletteOpen,
  setCommandPaletteOpen,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [boardsOpen, setBoardsOpen] = useState(true);

  // Fetch boards for sidebar list
  const { data: boards } = trpc.boards.list.useQuery(undefined, {
    staleTime: 30000,
  });

  // Fetch triage count
  const { data: triageTasks } = trpc.boards.getTriageTasks.useQuery(undefined, {
    staleTime: 10000,
  });
  const triageCount = triageTasks?.length ?? 0;

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (commandPaletteOpen) return;
      if (e.metaKey || e.ctrlKey) {
        const idx = parseInt(e.key);
        if (idx >= 1 && idx <= primaryNav.length) {
          e.preventDefault();
          setLocation(primaryNav[idx - 1].path);
        }
        if (e.key === "k") {
          e.preventDefault();
          setCommandPaletteOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setLocation, commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft =
        sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const isActivePath = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  const activeLabel =
    primaryNav.find((item) => isActivePath(item.path))?.label ??
    (location.startsWith("/boards/") ? "Board" : "Menu");

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-14 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Kanban className="h-4 w-4 text-primary" />
                    <span className="font-semibold tracking-tight truncate text-sm">
                      Kanban AI
                    </span>
                  </div>
                  <button
                    onClick={() => setCommandPaletteOpen(true)}
                    className="h-7 w-7 flex items-center justify-center hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="Search (⌘K)"
                    title="Search (⌘K)"
                  >
                    <Search className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            {/* Primary Navigation */}
            <SidebarMenu className="px-2 py-1">
              {primaryNav.map((item) => {
                const isActive = isActivePath(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-9 transition-all font-normal text-[13px] ${
                        isActive
                          ? "border-l-2 border-primary bg-accent/50 font-medium"
                          : "border-l-2 border-transparent"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive
                            ? "text-primary"
                            : item.label === "Triage" && triageCount > 0
                              ? "text-[var(--status-triage)]"
                              : ""
                        }`}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.hasBadge && triageCount > 0 && !isCollapsed && (
                        <Badge
                          variant="destructive"
                          className="h-5 min-w-5 px-1.5 text-[10px] font-bold bg-[var(--status-triage)] text-background animate-pipeline-pulse"
                        >
                          {triageCount}
                        </Badge>
                      )}
                      {!item.hasBadge && !isCollapsed && (
                        <span className="text-[10px] text-muted-foreground/50 font-mono">
                          {item.shortcut}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {!isCollapsed && (
              <>
                <Separator className="my-2 mx-2" />

                {/* Board List */}
                <Collapsible
                  open={boardsOpen}
                  onOpenChange={setBoardsOpen}
                  className="px-2"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                    <span>Your Boards</span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${
                        boardsOpen ? "" : "-rotate-90"
                      }`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="py-1">
                      {boards?.map(
                        (board: {
                          id: number;
                          name: string;
                        }) => {
                          const boardPath = `/boards/${board.id}`;
                          const isBoardActive = location === boardPath;
                          return (
                            <SidebarMenuItem key={board.id}>
                              <SidebarMenuButton
                                isActive={isBoardActive}
                                onClick={() => setLocation(boardPath)}
                                tooltip={board.name}
                                className={`h-8 text-[13px] font-normal pl-4 ${
                                  isBoardActive
                                    ? "border-l-2 border-primary bg-accent/50 font-medium"
                                    : "border-l-2 border-transparent"
                                }`}
                              >
                                <Kanban className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">{board.name}</span>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        }
                      )}
                      {(!boards || boards.length === 0) && (
                        <div className="px-4 py-2 text-[11px] text-muted-foreground/60">
                          No boards yet
                        </div>
                      )}
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => setLocation("/")}
                          tooltip="Create board"
                          className="h-8 text-[12px] font-normal pl-4 text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="h-3.5 w-3.5 shrink-0" />
                          <span>New Board</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-[13px] font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-1">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground text-sm">
                    {activeLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
