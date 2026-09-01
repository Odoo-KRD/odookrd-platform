"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export interface CoursePlayerShellLabels {
  lessons: string;
  chapters: string;
  resources: string;
  enterFullscreen: string;
  exitFullscreen: string;
  collapseSidebar: string;
  expandSidebar: string;
  backToCourse: string;
}

export interface CoursePlayerShellProps {
  courseTitle: string;
  lessonTitle: string;
  backHref: string;
  labels: CoursePlayerShellLabels;
  lessonsPanel: ReactNode;
  chaptersPanel?: ReactNode;
  resourcesPanel: ReactNode;
  lessonsCount: number;
  chaptersCount?: number;
  resourcesCount: number;
  media: ReactNode;
  lessonMeta: ReactNode;
  navigation: ReactNode;
}

function LessonsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M5 5h14v14H5zM8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}

function ChaptersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M6 5h12M6 12h12M6 19h12" />
      <path d="M3.5 5h.01M3.5 12h.01M3.5 19h.01" />
    </svg>
  );
}

function ResourcesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M7 3.5h6l4 4V20H7z" />
      <path d="M13 3.5V8h4M9 12h6M9 16h6" />
    </svg>
  );
}

function FullscreenIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4 fill-none stroke-current"
      strokeWidth="1.8"
    >
      {active ? (
        <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
      ) : (
        <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
      )}
    </svg>
  );
}

function SidebarIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4 fill-none stroke-current rtl:-scale-x-100"
      strokeWidth="1.8"
    >
      <path d="M4 5h16v14H4zM9 5v14" />
      {collapsed ? <path d="m13 9 3 3-3 3" /> : <path d="m16 9-3 3 3 3" />}
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4 fill-none stroke-current rtl:-scale-x-100"
      strokeWidth="1.8"
    >
      <path d="m15 6-6 6 6 6M9 12h10" />
    </svg>
  );
}

function CountBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300">
      {value}
    </span>
  );
}

export function CoursePlayerShell({
  courseTitle,
  lessonTitle,
  backHref,
  labels,
  lessonsPanel,
  chaptersPanel,
  resourcesPanel,
  lessonsCount,
  chaptersCount = 0,
  resourcesCount,
  media,
  lessonMeta,
  navigation,
}: CoursePlayerShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<
    "lessons" | "chapters" | "resources"
  >("lessons");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  useEffect(() => {
    function syncFullscreen(): void {
      setFullscreen(document.fullscreenElement === rootRef.current);
    }

    document.addEventListener("fullscreenchange", syncFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  async function toggleFullscreen(): Promise<void> {
    const root = rootRef.current;
    if (!root) return;

    if (document.fullscreenElement === root) {
      await document.exitFullscreen();
      return;
    }

    await root.requestFullscreen();
  }

  const panel =
    activeTab === "lessons"
      ? lessonsPanel
      : activeTab === "chapters" && chaptersPanel
        ? chaptersPanel
        : resourcesPanel;

  const tabColumns = chaptersPanel ? "grid-cols-3" : "grid-cols-2";

  const tabs = (
    <div
      className={`grid h-12 shrink-0 ${tabColumns} border-b border-white/10`}
    >
      <button
        type="button"
        onClick={() => setActiveTab("lessons")}
        className={`inline-flex items-center justify-center gap-2 border-b-2 px-3 text-xs font-semibold transition ${
          activeTab === "lessons"
            ? "border-brand bg-white/5 text-white"
            : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        <LessonsIcon />
        {labels.lessons}
        <CountBadge value={lessonsCount} />
      </button>

      {chaptersPanel ? (
        <button
          type="button"
          onClick={() => setActiveTab("chapters")}
          className={`inline-flex items-center justify-center gap-2 border-b-2 px-3 text-xs font-semibold transition ${
            activeTab === "chapters"
              ? "border-brand bg-white/5 text-white"
              : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <ChaptersIcon />
          {labels.chapters}
          <CountBadge value={chaptersCount} />
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => setActiveTab("resources")}
        className={`inline-flex items-center justify-center gap-2 border-b-2 px-3 text-xs font-semibold transition ${
          activeTab === "resources"
            ? "border-brand bg-white/5 text-white"
            : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        <ResourcesIcon />
        {labels.resources}
        <CountBadge value={resourcesCount} />
      </button>
    </div>
  );

  return (
    <div
      ref={rootRef}
      className="course-player-root flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-slate-950 text-white"
    >
      <header className="z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-slate-900 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setMobilePanelOpen(true)}
            className="inline-flex size-9 items-center justify-center rounded-md text-slate-200 hover:bg-white/10 lg:hidden"
            aria-label={labels.lessons}
          >
            <LessonsIcon />
          </button>

          <button
            type="button"
            onClick={() => setSidebarCollapsed((value) => !value)}
            className="hidden size-9 items-center justify-center rounded-md text-slate-200 hover:bg-white/10 lg:inline-flex"
            aria-label={
              sidebarCollapsed ? labels.expandSidebar : labels.collapseSidebar
            }
            title={
              sidebarCollapsed ? labels.expandSidebar : labels.collapseSidebar
            }
          >
            <SidebarIcon collapsed={sidebarCollapsed} />
          </button>

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">
              {courseTitle}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              {lessonTitle}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
            title={fullscreen ? labels.exitFullscreen : labels.enterFullscreen}
          >
            <FullscreenIcon active={fullscreen} />
            <span className="hidden md:inline">
              {fullscreen ? labels.exitFullscreen : labels.enterFullscreen}
            </span>
          </button>

          <a
            href={backHref}
            className="inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            <BackIcon />
            <span className="hidden sm:inline">{labels.backToCourse}</span>
          </a>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={`hidden shrink-0 border-e border-white/10 bg-slate-900 transition-[width] duration-200 lg:flex lg:flex-col ${
            sidebarCollapsed ? "w-0 overflow-hidden border-e-0" : "w-[340px]"
          }`}
        >
          {tabs}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {panel}
          </div>
        </aside>

        {mobilePanelOpen ? (
          <div className="absolute inset-0 z-40 flex lg:hidden">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setMobilePanelOpen(false)}
              className="absolute inset-0 bg-black/60"
            />
            <aside className="relative z-10 flex h-full w-[min(88vw,360px)] flex-col bg-slate-900 shadow-2xl">
              {tabs}
              <div className="min-h-0 flex-1 overflow-y-auto">{panel}</div>
            </aside>
          </div>
        ) : null}

        <main className="flex min-w-0 flex-1 flex-col bg-black">
          <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-full w-full">{media}</div>
            </div>
          </div>

          <div className="shrink-0 border-t border-white/10 bg-slate-900">
            <div className="px-4 py-3 sm:px-5">{lessonMeta}</div>
            <div className="border-t border-white/10 px-4 py-2.5 sm:px-5">
              {navigation}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
