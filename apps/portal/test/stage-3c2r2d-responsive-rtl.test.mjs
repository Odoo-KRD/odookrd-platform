import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const workspaceRoot = new URL("../../../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, workspaceRoot), "utf8");

const playerShell = read(
  "apps/portal/src/components/training/course-player-shell.tsx",
);
const lessonPage = read(
  "apps/portal/src/app/(protected)/(customer)/dashboard/training/[slug]/lessons/[lessonId]/page.tsx",
);
const articleViewer = read(
  "apps/portal/src/components/training/lesson-article-viewer.tsx",
);
const pdfViewer = read(
  "apps/portal/src/components/training/pdf-slide-viewer.tsx",
);
const videoPlayer = read(
  "apps/portal/src/components/training/branded-video-player.tsx",
);
const chaptersPanel = read(
  "apps/portal/src/components/training/course-player-chapters-panel.tsx",
);
const workspaceDictionary = read(
  "apps/portal/src/lib/i18n/training-customer-workspace.ts",
);
const mediaDictionary = read("apps/portal/src/lib/i18n/training-media.ts");
const rootLayout = read("apps/portal/src/app/layout.tsx");
const globalCss = read("apps/portal/src/app/globals.css");

test("R2D keeps the immersive player viewport and responsive sidebar split", () => {
  assert.match(playerShell, /h-\[100dvh\]/);
  assert.match(playerShell, /lg:hidden/);
  assert.match(playerShell, /lg:flex/);
  assert.match(playerShell, /w-\[min\(88vw,360px\)\]/);
  assert.match(playerShell, /w-\[340px\]/);
});

test("R2D mobile drawer has a localized explicit close action", () => {
  assert.match(playerShell, /labels\.closeSidebar/);
  assert.match(playerShell, /<CloseIcon \/>/);
  assert.doesNotMatch(playerShell, /aria-label="Close"/);
  assert.match(
    workspaceDictionary,
    /closeCourseSidebar: "Close course sidebar"/,
  );
  assert.match(workspaceDictionary, /closeCourseSidebar: "داخستنی لیستی کۆرس"/);
  assert.match(workspaceDictionary, /closeCourseSidebar: "إغلاق قائمة الدورة"/);
  assert.match(lessonPage, /closeSidebar: workspace\.closeCourseSidebar/);
});

test("R2D keeps responsive count badges and equal-width tab cells", () => {
  assert.match(
    playerShell,
    /className="hidden min-w-5 shrink-0[\s\S]*sm:inline-flex"/,
  );
  assert.match(
    playerShell,
    /const tabColumns = chaptersPanel \? "grid-cols-3" : "grid-cols-2"/,
  );
  assert.match(
    playerShell,
    /grid h-12 shrink-0 \$\{tabColumns\} border-b border-white\/10/,
  );
  assert.match(
    playerShell,
    /inline-flex min-w-0 items-center justify-center gap-1\.5 border-b-2 px-2/,
  );
  assert.match(
    playerShell,
    /<span className="min-w-0 truncate">\{labels\.resources\}<\/span>/,
  );
});

test("R2D article and PDF lessons remain usable in constrained media viewports", () => {
  assert.match(
    articleViewer,
    /h-full min-h-0 overflow-y-auto overscroll-contain/,
  );
  assert.match(pdfViewer, /flex h-full min-h-0 flex-col overflow-hidden/);
  assert.match(
    pdfViewer,
    /min-h-0 flex-1[\s\S]*overflow-auto overscroll-contain/,
  );
  assert.doesNotMatch(pdfViewer, /min-h-\[420px\]/);
  assert.match(pdfViewer, /new ResizeObserver/);
  assert.match(pdfViewer, /availableWidth \/ baseViewport\.width/);
  assert.match(pdfViewer, /availableHeight \/ baseViewport\.height/);
  assert.match(
    pdfViewer,
    /canvas\.style\.width = `\$\{Math\.floor\(viewport\.width\)\}px`/,
  );
  assert.match(
    pdfViewer,
    /canvas\.style\.height = `\$\{Math\.floor\(viewport\.height\)\}px`/,
  );
  assert.match(pdfViewer, /block shrink-0 bg-white shadow-2xl/);
});

test("R2D retains application RTL while media controls remain LTR", () => {
  assert.match(rootLayout, /dir=\{getTextDirection\(locale\)\}/);
  assert.match(videoPlayer, /<MediaPlayer[\s\S]*dir="ltr"/);
  assert.match(
    globalCss,
    /\.odookrd-video-player\s*\{[\s\S]*direction:\s*ltr;/,
  );
  assert.match(videoPlayer, /textDir=\{rtl \? "rtl" : "ltr"\}/);
});

test("R2D localizes chapter track metadata and preserves bidi-safe timestamps", () => {
  assert.match(mediaDictionary, /chapters: "Chapters"/);
  assert.match(mediaDictionary, /chapters: "بەشەکان"/);
  assert.match(mediaDictionary, /chapters: "الفصول"/);
  assert.match(videoPlayer, /label=\{chapterTrackLabel\}/);
  assert.match(
    chaptersPanel,
    /dir="ltr"[\s\S]*formatTime\(chapter\.startSeconds\)/,
  );
});

test("R2D uses bidi-safe resource and lesson-position metadata", () => {
  assert.match(lessonPage, /dir="auto"[\s\S]*resource\.originalFilename/);
  assert.match(
    lessonPage,
    /<span dir="ltr">\{formatBytes\(resource\.sizeBytes\)\}<\/span>/,
  );
  assert.match(
    lessonPage,
    /<span dir="ltr">[\s\S]*currentIndex >= 0 \? currentIndex \+ 1 : 1/,
  );
});

test("R2D preserves logical-side RTL primitives in the player", () => {
  assert.match(playerShell, /border-e border-white\/10/);
  assert.match(lessonPage, /border-s-2 border-brand/);
  assert.match(chaptersPanel, /border-s-2/);
  assert.match(playerShell, /rtl:-scale-x-100/);
});

test("R2D uses clean icon-free tabs and keeps resources panel logical padding", () => {
  assert.match(
    playerShell,
    /const tabColumns = chaptersPanel \? "grid-cols-3" : "grid-cols-2"/,
  );
  assert.doesNotMatch(playerShell, /function ChaptersIcon/);
  assert.doesNotMatch(playerShell, /function ResourcesIcon/);

  const lessonPage = read(
    "apps/portal/src/app/(protected)/(customer)/dashboard/training/[slug]/lessons/[lessonId]/page.tsx",
  );
  assert.match(lessonPage, /box-border w-full ps-4 pe-4 py-4/);
});
