"use client";

import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useSystemStore } from "@/stores/system-store";
import {
  LayoutGrid,
  Plus,
  Clock,
  Bot,
  X,
  ChevronDown,
} from "lucide-react";
import type { TaskRecord, TaskStatus, TaskPriority } from "@claudeforge/shared";
import { api } from "@/lib/api";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "backlog", label: "Backlog", color: "text-text-secondary" },
  { status: "in_progress", label: "In Progress", color: "text-info" },
  { status: "review", label: "Review", color: "text-warning" },
  { status: "done", label: "Done", color: "text-success" },
];

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-error/20 text-error",
  high: "bg-warning/20 text-warning",
  normal: "bg-text-muted/20 text-text-secondary",
  low: "bg-text-muted/10 text-text-muted",
};

const STATUS_ORDER: TaskStatus[] = ["backlog", "in_progress", "review", "done"];

function TaskCardContent({
  task,
  onStatusChange,
}: {
  task: TaskRecord;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const age = Math.floor((Date.now() - task.createdAt) / 60000);
  const ageStr = age < 60 ? `${age}m` : `${Math.floor(age / 60)}h`;

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-text-primary line-clamp-2">
          {task.title}
        </span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
            PRIORITY_COLORS[task.priority]
          }`}
        >
          {task.priority}
        </span>
      </div>
      {task.description && (
        <p className="text-xs text-text-muted mt-1 line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
        {task.agent && (
          <span className="flex items-center gap-1">
            <Bot size={10} /> {task.agent}
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <Clock size={10} /> {ageStr}
        </span>
      </div>

      {onStatusChange && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowStatusMenu(!showStatusMenu);
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-text-primary"
          >
            <ChevronDown size={14} />
          </button>
          {showStatusMenu && (
            <div className="absolute top-8 right-2 z-10 bg-surface-elevated border border-border rounded-lg shadow-lg py-1 min-w-[120px]">
              {STATUS_ORDER.filter((s) => s !== task.status).map((s) => (
                <button
                  key={s}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, s);
                    setShowStatusMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-primary/5 transition-colors"
                >
                  {COLUMNS.find((c) => c.status === s)?.label ?? s}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

function SortableTaskCard({
  task,
  onStatusChange,
}: {
  task: TaskRecord;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { status: task.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-surface border border-border rounded-lg p-3 hover:border-primary/25 transition-colors group relative cursor-grab active:cursor-grabbing"
    >
      <TaskCardContent task={task} onStatusChange={onStatusChange} />
    </div>
  );
}

function DroppableColumn({
  status,
  label,
  color,
  tasks,
  onStatusChange,
}: {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: TaskRecord[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div className="w-72 flex flex-col shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <span
          className={`text-xs font-medium uppercase tracking-wider ${color}`}
        >
          {label}
        </span>
        <span className="text-xs text-text-muted bg-surface-elevated px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 overflow-y-auto rounded-lg p-1 transition-colors ${
          isOver ? "border border-primary/40 bg-primary/5" : "border border-transparent"
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="text-xs text-text-muted text-center py-8 border border-dashed border-border rounded-lg">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

function CreateTaskDialog({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [submitting, setSubmitting] = useState(false);
  const trapRef = useFocusTrap(true);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await api.createTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        status: "backlog",
      });
      onClose();
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Create new task"
      ref={trapRef}
    >
      <div className="bg-surface-elevated border border-border rounded-xl w-full max-w-md mx-4 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-text-primary font-semibold">New Task</span>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-colors resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Priority
            </label>
            <div className="relative">
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as TaskPriority)
                }
                className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg text-text-primary appearance-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-colors"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-primary/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || submitting}
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { tasks } = useSystemStore();
  const [showCreate, setShowCreate] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await api.updateTask(taskId, { status });
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const overId = String(over.id);

    // Determine target column: if dropped on a column droppable, overId is the status;
    // if dropped on another task, look up that task's status.
    let newStatus: TaskStatus | undefined;

    if (STATUS_ORDER.includes(overId as TaskStatus)) {
      newStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (!newStatus) return;

    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask || draggedTask.status === newStatus) return;

    try {
      await api.updateTask(taskId, { status: newStatus });
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  const activeTask = activeId
    ? tasks.find((t) => t.id === activeId) ?? null
    : null;

  const isEmpty = tasks.length === 0;

  return (
    <Layout>
      <ErrorBoundary>
        <div className="h-full flex flex-col">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <LayoutGrid
                size={20}
                strokeWidth={1.5}
                className="text-primary"
              />
              <h1 className="text-lg font-semibold">Tasks</h1>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              aria-label="Create new task"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded transition-colors"
            >
              <Plus size={14} /> New Task
            </button>
          </div>

          {isEmpty ? (
            <div className="flex-1 flex items-center justify-center text-text-muted">
              <div className="text-center">
                <LayoutGrid
                  size={48}
                  strokeWidth={1}
                  className="mx-auto mb-4 opacity-30"
                />
                <p className="text-lg font-medium">No tasks yet</p>
                <p className="text-sm mt-1">
                  Create one with the{" "}
                  <button
                    onClick={() => setShowCreate(true)}
                    className="text-primary hover:underline"
                  >
                    + New Task
                  </button>{" "}
                  button above.
                </p>
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex-1 overflow-x-auto p-4">
                <div className="flex gap-4 h-full min-w-max">
                  {COLUMNS.map((col) => {
                    const columnTasks = tasks.filter(
                      (t) => t.status === col.status
                    );
                    return (
                      <DroppableColumn
                        key={col.status}
                        status={col.status}
                        label={col.label}
                        color={col.color}
                        tasks={columnTasks}
                        onStatusChange={handleStatusChange}
                      />
                    );
                  })}
                </div>
              </div>
              <DragOverlay>
                {activeTask ? (
                  <div className="bg-surface border border-border rounded-lg p-3 shadow-lg shadow-primary/20 w-72 group relative">
                    <TaskCardContent task={activeTask} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
        {showCreate && (
          <CreateTaskDialog onClose={() => setShowCreate(false)} />
        )}
      </ErrorBoundary>
    </Layout>
  );
}
