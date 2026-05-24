import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  AlertTriangle,
  Bot,
  Plug,
  History,
  Kanban,
} from "lucide-react";

const navigationItems = [
  {
    icon: LayoutDashboard,
    label: "Boards",
    path: "/",
    shortcut: "B",
  },
  {
    icon: AlertTriangle,
    label: "Triage",
    path: "/triage",
    shortcut: "T",
  },
  {
    icon: Bot,
    label: "Agents",
    path: "/agents",
    shortcut: "A",
  },
  {
    icon: Plug,
    label: "Providers",
    path: "/providers",
    shortcut: "P",
  },
  {
    icon: History,
    label: "Executions",
    path: "/executions",
    shortcut: "E",
  },
];

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const value = typeof next === "function" ? next(open) : next;
    if (!isControlled) setUncontrolledOpen(value);
    onOpenChange?.(value);
  };
  const [, setLocation] = useLocation();

  const { data: boards } = trpc.boards.list.useQuery(undefined, {
    enabled: open,
  });

  const handleSelect = useCallback(
    (path: string) => {
      setLocation(path);
      setOpen(false);
    },
    [setLocation],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      description="Search for pages, boards, and commands..."
      showCloseButton={false}
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.path}
              value={item.label}
              onSelect={() => handleSelect(item.path)}
              className="gap-3"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span>{item.label}</span>
              <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                {item.shortcut}
              </kbd>
            </CommandItem>
          ))}
        </CommandGroup>

        {boards && boards.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Boards">
              {boards.map((board) => (
                <CommandItem
                  key={board.id}
                  value={`board ${board.name}`}
                  onSelect={() => handleSelect(`/boards/${board.id}`)}
                  className="gap-3"
                >
                  <Kanban className="h-4 w-4 text-muted-foreground" />
                  <span>{board.name}</span>
                  {board.description && (
                    <span className="ml-2 text-xs text-muted-foreground truncate max-w-[200px]">
                      {board.description}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
