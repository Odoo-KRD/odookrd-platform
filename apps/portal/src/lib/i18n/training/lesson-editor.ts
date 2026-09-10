import type { Locale } from "@odookrd/types";

import { uiChrome } from "../ui-chrome";
import { sharedText } from "../shared";

export interface TrainingLessonEditorDictionary {
  title: string;
  subtitle: string;
  tabs: { general: string; content: string; resources: string; review: string };
  backToCourse: string;
  save: string;
  saving: string;
  saved: string;
  general: {
    title: string;
    description: string;
    status: string;
    draft: string;
    published: string;
    archived: string;
  };
  content: {
    title: string;
    help: string;
    noContent: string;
    chooseType: string;
    video: string;
    document: string;
    article: string;
    quiz: string;
    videoHelp: string;
    documentHelp: string;
    articleHelp: string;
    quizHelp: string;
    source: string;
    local: string;
    aws: string;
    url: string;
    localHelp: string;
    awsHelp: string;
    urlHelp: string;
    chooseMp4: string;
    choosePdf: string;
    upload: string;
    uploadProcess: string;
    attachDocument: string;
    playbackUrl: string;
    advancedMetadata: string;
    sourceSize: string;
    processedSize: string;
    duration: string;
    width: string;
    height: string;
    ready: string;
    processing: string;
    uploading: string;
    failed: string;
    notReady: string;
    clear: string;
    confirmSwitch: string;
    quizReserved: string;
    articleSave: string;
    dropTitle: string;
    dropHelp: string;
    browseVideo: string;
    replaceVideo: string;
    removeSelection: string;
    maxUploadHint: string;
    videoDetails: string;
    thumbnail: string;
    thumbnailHelp: string;
    changeThumbnail: string;
    autoThumbnail: string;
    deleteVideo: string;
    confirmDeleteVideo: string;
    retryProcessing: string;
    uploadProgress: string;
    processingProgress: string;
    finalizing: string;
    playback: string;
    available: string;
    unavailable: string;
    originalSize: string;
    processedSizeLabel: string;
    resolution: string;
    variants: string;
    sourceLabel: string;
    uploadComplete: string;
    processingStarted: string;
    failedHelp: string;
    dismiss: string;
    stepSelect: string;
    stepUpload: string;
    stepProcess: string;
    stepFinalize: string;
    stepReady: string;
    stepConfigure: string;
    stepValidate: string;
    stepSelectHelp: string;
    currentContent: string;
    changeContentType: string;
    cancelChangeType: string;
    removePrimaryContent: string;
    videoWorkspace: string;
    videoWorkspaceHelp: string;
    currentVideo: string;
    currentVideoHelp: string;
    processingFailedTitle: string;
    protectedHls: string;
    protectedMp4: string;
    externalHls: string;
    saveThumbnail: string;
    thumbnailUpdated: string;
    videoDeleted: string;
    videoReadyToast: string;
    replacingVideo: string;
    replacingVideoHelp: string;
    cancelReplace: string;
    uploadReplacement: string;
    uploadReplacementProcess: string;
    awsLockedHelp: string;
    localLockedHelp: string;
  };
  resources: {
    title: string;
    help: string;
    add: string;
    chooseFile: string;
    displayTitle: string;
    customerVisible: string;
    save: string;
    remove: string;
    moveUp: string;
    moveDown: string;
    empty: string;
  };
  review: {
    title: string;
    ready: string;
    notReady: string;
    publish: string;
    resources: string;
    blockers: Record<string, string>;
  };
  errors: {
    requestFailed: string;
    invalidMp4: string;
    invalidPdf: string;
    uploadFailed: string;
  };
  contentTypes: Record<"VIDEO" | "DOCUMENT" | "ARTICLE" | "QUIZ", string>;
}

export const trainingLessonEditorDictionaries: Record<
  Locale,
  TrainingLessonEditorDictionary
> = {
  en: {
    title: "Lesson Editor",
    subtitle:
      "Manage lesson information, primary content, resources and publication readiness.",
    tabs: {
      general: "General",
      content: "Content",
      resources: sharedText.en.labels.resources,
      review: "Review",
    },
    backToCourse: "Back to course editor",
    save: "Save changes",
    saving: sharedText.en.actions.saving,
    saved: "Changes saved.",
    general: {
      title: "Lesson title",
      description: "Rich description",
      status: "Status",
      draft: "Draft",
      published: "Published",
      archived: sharedText.en.status.archived,
    },
    content: {
      title: "Primary lesson content",
      help: "Choose exactly one primary content type for this lesson.",
      noContent: "No primary content is configured.",
      chooseType: "Content type",
      video: "Video",
      document: "Document",
      article: "Article",
      quiz: sharedText.en.labels.quiz,
      videoHelp:
        "Protected video playback using local delivery, automated AWS processing or a prepared URL.",
      documentHelp: "Upload a private PDF and present it page by page.",
      articleHelp: "Create multilingual rich lesson content.",
      quizHelp: "Quiz content is reserved for the later quiz implementation.",
      source: "Video source",
      local: "Local Video",
      aws: "AWS Video",
      url: "URL",
      localHelp:
        "Store an MP4 privately on the platform server with protected Range delivery.",
      awsHelp:
        "Upload directly to S3 and let MediaConvert create protected HLS automatically.",
      urlHelp: "Register a prepared HTTPS HLS/CDN playback URL.",
      chooseMp4: sharedText.en.labels.chooseMp4,
      choosePdf: sharedText.en.labels.choosePdf,
      upload: "Upload video",
      uploadProcess: sharedText.en.labels.uploadProcess,
      attachDocument: "Attach document",
      playbackUrl: "Playback URL",
      advancedMetadata: "Advanced metadata",
      sourceSize: sharedText.en.labels.sourceSize,
      processedSize: sharedText.en.labels.processedSize,
      duration: uiChrome.en.duration,
      width: sharedText.en.labels.width,
      height: sharedText.en.labels.height,
      ready: "Ready",
      processing: sharedText.en.status.processing,
      uploading: "Uploading",
      failed: "Failed",
      notReady: "Not ready",
      clear: "Clear primary content",
      confirmSwitch:
        "Changing the content type will detach the current primary content. Continue?",
      quizReserved:
        "Quiz content is intentionally reserved. The quiz engine will be connected in the later quiz stage, so this lesson cannot be published as a quiz yet.",
      articleSave: "Save article",
      dropTitle: "Drag & drop your MP4 video here",
      dropHelp: "or browse from your computer",
      browseVideo: "Browse video",
      replaceVideo: "Replace video",
      removeSelection: "Remove selection",
      maxUploadHint: "MP4 · maximum size follows the platform video limit",
      videoDetails: "Video information",
      thumbnail: "Thumbnail",
      thumbnailHelp:
        "A thumbnail is generated automatically for uploaded MP4 files. You can replace it with JPEG, PNG or WebP.",
      changeThumbnail: "Change thumbnail",
      autoThumbnail: "Auto-generated thumbnail",
      deleteVideo: "Delete video",
      confirmDeleteVideo:
        "Delete this video and its stored media? This cannot be undone.",
      retryProcessing: "Retry processing",
      uploadProgress: "Uploading video",
      processingProgress: "Processing video",
      finalizing: "Finalizing media",
      playback: "Playback",
      available: "Available",
      unavailable: "Unavailable",
      originalSize: "Original size",
      processedSizeLabel: "Processed size",
      resolution: sharedText.en.labels.resolution,
      variants: "HLS variants",
      sourceLabel: "Source",
      uploadComplete: "Upload complete",
      processingStarted: "Upload complete. MediaConvert processing started.",
      failedHelp:
        "Processing failed. Retry the existing upload or replace the video.",
      dismiss: "Dismiss",
      stepSelect: "Select video",
      stepUpload: "Upload",
      stepProcess: "Process",
      stepFinalize: "Finalize",
      stepReady: "Ready",
      stepConfigure: "Configure",
      stepValidate: "Validate",
      stepSelectHelp: "Choose the source and prepare the video.",
      currentContent: "Current content",
      changeContentType: "Change content type",
      cancelChangeType: "Cancel",
      removePrimaryContent: "Remove primary content",
      videoWorkspace: "Video content",
      videoWorkspaceHelp:
        "Configure the video source, upload and delivery lifecycle.",
      currentVideo: "Current video",
      currentVideoHelp:
        "This video is ready and available for protected playback.",
      processingFailedTitle: "Video processing failed",
      protectedHls: "Protected HLS",
      protectedMp4: "Protected MP4",
      externalHls: "External HLS/CDN",
      saveThumbnail: "Save thumbnail",
      thumbnailUpdated: "Video thumbnail updated.",
      videoDeleted: "Video deleted.",
      videoReadyToast: "Video upload completed and is ready.",
      replacingVideo: "Replace current video",
      replacingVideoHelp:
        "Choose the replacement source and upload a new video.",
      cancelReplace: "Cancel replacement",
      uploadReplacement: "Upload replacement",
      uploadReplacementProcess: "Upload & process replacement",
      awsLockedHelp:
        "The AWS video workflow is in progress. Source and file controls are locked until processing finishes.",
      localLockedHelp:
        "The local video upload is in progress. Source and file controls are locked until it finishes.",
    },
    resources: {
      title: "Lesson resources",
      help: "Attach supplemental files that entitled learners can download with this lesson.",
      add: "Add resource",
      chooseFile: "Choose file",
      displayTitle: "Display title",
      customerVisible: "Visible to customer",
      save: "Save",
      remove: sharedText.en.actions.remove,
      moveUp: sharedText.en.actions.moveUp,
      moveDown: sharedText.en.actions.moveDown,
      empty: "No resources are attached to this lesson.",
    },
    review: {
      title: "Publication readiness",
      ready: "This lesson is ready to publish.",
      notReady: "This lesson still has publication blockers.",
      publish: "Publish lesson",
      resources: sharedText.en.labels.resources,
      blockers: {
        NO_CONTENT: "Choose a primary content type.",
        VIDEO_NOT_READY: "Attach a ready video.",
        DOCUMENT_NOT_READY:
          "Attach a ready PDF document with a valid page count.",
        ARTICLE_EMPTY: "Add article content.",
        QUIZ_NOT_CONFIGURED:
          "Publish a valid quiz version before publishing this lesson.",
      },
    },
    errors: {
      requestFailed: "The request could not be completed.",
      invalidMp4: "Choose a valid MP4 video.",
      invalidPdf: "Choose a valid PDF document.",
      uploadFailed: "The file upload failed.",
    },
    contentTypes: {
      VIDEO: "Video",
      DOCUMENT: "Document",
      ARTICLE: "Article",
      QUIZ: "Quiz",
    },
  },
  ku: {
    title: "دەستکاریکەری وانە",
    subtitle:
      "زانیاری وانە، ناوەڕۆکی سەرەکی، سەرچاوەکان و ئامادەیی بۆ بڵاوکردنەوە بەڕێوە ببە.",
    tabs: {
      general: "گشتی",
      content: "ناوەڕۆک",
      resources: sharedText.ku.labels.resources,
      review: "پێداچوونەوە",
    },
    backToCourse: "گەڕانەوە بۆ دەستکاریکەری کۆرس",
    save: "پاشەکەوتکردن",
    saving: sharedText.ku.actions.saving,
    saved: "گۆڕانکارییەکان پاشەکەوت کران.",
    general: {
      title: "ناونیشانی وانە",
      description: "وەسفی دەوڵەمەند",
      status: "دۆخ",
      draft: "ڕەشنووس",
      published: "بڵاوکراوە",
      archived: sharedText.ku.status.archived,
    },
    content: {
      title: "ناوەڕۆکی سەرەکی وانە",
      help: "تەنها یەک جۆری ناوەڕۆکی سەرەکی بۆ ئەم وانەیە هەڵبژێرە.",
      noContent: "هیچ ناوەڕۆکی سەرەکی ڕێکنەخراوە.",
      chooseType: "جۆری ناوەڕۆک",
      video: "ڤیدیۆ",
      document: "بەڵگەنامە",
      article: "وتار",
      quiz: sharedText.ku.labels.quiz,
      videoHelp:
        "پەخشکردنی پارێزراوی ڤیدیۆ بە لوکاڵ، پرۆسەکردنی ئۆتۆماتیکی AWS یان URL.",
      documentHelp: "فایلی PDF تایبەت باربکە و پەڕە بە پەڕە پیشانی بدە.",
      articleHelp: "ناوەڕۆکی دەوڵەمەندی چەندزمانی دروست بکە.",
      quizHelp: "ناوەڕۆکی تاقیکردنەوە بۆ قۆناغی دواتری Quiz پارێزراوە.",
      source: "سەرچاوەی ڤیدیۆ",
      local: "ڤیدیۆی لوکاڵ",
      aws: "ڤیدیۆی AWS",
      url: "URL",
      localHelp:
        "MP4 بە نهێنی لە سێرڤەر هەڵگرە و بە HTTP Range پارێزراو پەخشی بکە.",
      awsHelp:
        "ڕاستەوخۆ بۆ S3 باربکە و MediaConvert بە ئۆتۆماتیکی HLS دروست بکات.",
      urlHelp: "URL ـی HTTPS/HLS ئامادەکراو تۆمار بکە.",
      chooseMp4: sharedText.ku.labels.chooseMp4,
      choosePdf: sharedText.ku.labels.choosePdf,
      upload: "بارکردنی ڤیدیۆ",
      uploadProcess: sharedText.ku.labels.uploadProcess,
      attachDocument: "بەستنەوەی بەڵگەنامە",
      playbackUrl: "URL ـی پەخش",
      advancedMetadata: "زانیاری پێشکەوتوو",
      sourceSize: sharedText.ku.labels.sourceSize,
      processedSize: sharedText.ku.labels.processedSize,
      duration: uiChrome.ku.duration,
      width: sharedText.ku.labels.width,
      height: sharedText.ku.labels.height,
      ready: "ئامادە",
      processing: sharedText.ku.status.processing,
      uploading: "باردەکرێت",
      failed: "شکستی هێنا",
      notReady: "ئامادە نییە",
      clear: "پاککردنەوەی ناوەڕۆکی سەرەکی",
      confirmSwitch:
        "گۆڕینی جۆری ناوەڕۆک، ناوەڕۆکی سەرەکی ئێستا جیا دەکاتەوە. بەردەوام بیت؟",
      quizReserved:
        "تاقیکردنەوە بە مەبەستی قۆناغی دواتر پارێزراوە. لەم قۆناغەدا وانەی Quiz ناتوانرێت بڵاوبکرێتەوە.",
      articleSave: "پاشەکەوتکردنی وتار",
      dropTitle: "ڤیدیۆی MP4 بکێشە و لێرە دایبنێ",
      dropHelp: "یان لە کۆمپیوتەرەکەت هەڵیبژێرە",
      browseVideo: "هەڵبژاردنی ڤیدیۆ",
      replaceVideo: "گۆڕینی ڤیدیۆ",
      removeSelection: "لابردنی هەڵبژاردە",
      maxUploadHint: "MP4 · سنووری قەبارە بە پێی ڕێکخستنی پلاتفۆرمە",
      videoDetails: "زانیاری ڤیدیۆ",
      thumbnail: "وێنۆچکە",
      thumbnailHelp:
        "بۆ MP4 ـی بارکراو وێنۆچکە بە ئۆتۆماتیکی دروست دەکرێت؛ دەتوانیت JPEG، PNG یان WebP جێگرەوە بکەیت.",
      changeThumbnail: "گۆڕینی وێنۆچکە",
      autoThumbnail: "وێنۆچکەی ئۆتۆماتیکی",
      deleteVideo: "سڕینەوەی ڤیدیۆ",
      confirmDeleteVideo:
        "ئەم ڤیدیۆیە و میدیای هەڵگیراوی بسڕیتەوە؟ ئەمە ناگەڕێتەوە.",
      retryProcessing: "دووبارە پرۆسەکردن",
      uploadProgress: "بارکردنی ڤیدیۆ",
      processingProgress: "پرۆسەکردنی ڤیدیۆ",
      finalizing: "تەواوکردنی میدیا",
      playback: "پەخش",
      available: "بەردەستە",
      unavailable: "بەردەست نییە",
      originalSize: "قەبارەی سەرەکی",
      processedSizeLabel: "قەبارەی پرۆسەکراو",
      resolution: sharedText.ku.labels.resolution,
      variants: "جۆرەکانی HLS",
      sourceLabel: "سەرچاوە",
      uploadComplete: "بارکردن تەواو بوو",
      processingStarted:
        "بارکردن تەواو بوو. پرۆسەکردنی MediaConvert دەستی پێکرد.",
      failedHelp:
        "پرۆسەکردن شکستی هێنا. دووبارە هەمان فایل پرۆسە بکە یان ڤیدیۆکە بگۆڕە.",
      dismiss: "داخستن",
      stepSelect: "هەڵبژاردنی ڤیدیۆ",
      stepUpload: "بارکردن",
      stepProcess: "پرۆسەکردن",
      stepFinalize: "کۆتاییهێنان",
      stepReady: "ئامادە",
      stepConfigure: "ڕێکخستن",
      stepValidate: "پشتڕاستکردنەوە",
      stepSelectHelp: "سەرچاوە هەڵبژێرە و ڤیدیۆکە ئامادە بکە.",
      currentContent: "ناوەڕۆکی ئێستا",
      changeContentType: "گۆڕینی جۆری ناوەڕۆک",
      cancelChangeType: "هەڵوەشاندنەوە",
      removePrimaryContent: "لابردنی ناوەڕۆکی سەرەکی",
      videoWorkspace: "ناوەڕۆکی ڤیدیۆ",
      videoWorkspaceHelp: "سەرچاوە، بارکردن و دۆخی پەخشکردنی ڤیدیۆ بەڕێوە ببە.",
      currentVideo: "ڤیدیۆی ئێستا",
      currentVideoHelp:
        "ئەم ڤیدیۆیە ئامادەیە و بە شێوەی پارێزراو دەتوانرێت پەخش بکرێت.",
      processingFailedTitle: "پرۆسەکردنی ڤیدیۆ شکستی هێنا",
      protectedHls: "HLS ـی پارێزراو",
      protectedMp4: "MP4 ـی پارێزراو",
      externalHls: "HLS/CDN ـی دەرەکی",
      saveThumbnail: "پاشەکەوتکردنی وێنۆچکە",
      thumbnailUpdated: "وێنۆچکەی ڤیدیۆ نوێکرایەوە.",
      videoDeleted: "ڤیدیۆ سڕایەوە.",
      videoReadyToast: "بارکردنی ڤیدیۆ تەواو بوو و ئامادەیە.",
      replacingVideo: "گۆڕینی ڤیدیۆی ئێستا",
      replacingVideoHelp: "سەرچاوەی جێگرەوە هەڵبژێرە و ڤیدیۆیەکی نوێ باربکە.",
      cancelReplace: "هەڵوەشاندنەوەی گۆڕین",
      uploadReplacement: "بارکردنی جێگرەوە",
      uploadReplacementProcess: "بارکردن و پرۆسەکردنی جێگرەوە",
      awsLockedHelp:
        "پرۆسەی AWS بەردەوامە. تا تەواوبوون سەرچاوە و هەڵبژاردنی فایل قوفڵ دەبن.",
      localLockedHelp:
        "بارکردنی ڤیدیۆی لوکاڵ بەردەوامە. تا تەواوبوون سەرچاوە و هەڵبژاردنی فایل قوفڵ دەبن.",
    },
    resources: {
      title: "سەرچاوەکانی وانە",
      help: "فایلە یارمەتیدەرەکان ببەستەوە تا فێرخوازانی دەسەڵاتپێدراو بتوانن دایانبگرن.",
      add: "زیادکردنی سەرچاوە",
      chooseFile: "فایل هەڵبژێرە",
      displayTitle: "ناونیشانی پیشاندان",
      customerVisible: "دیار بۆ کڕیار",
      save: "پاشەکەوت",
      remove: sharedText.ku.actions.remove,
      moveUp: "بەرەو سەرەوە",
      moveDown: "بەرەو خوارەوە",
      empty: "هیچ سەرچاوەیەک بەو وانەیەوە نەبەستراوە.",
    },
    review: {
      title: "ئامادەیی بۆ بڵاوکردنەوە",
      ready: "ئەم وانەیە ئامادەی بڵاوکردنەوەیە.",
      notReady: "هێشتا کێشەی بڵاوکردنەوە هەیە.",
      publish: "بڵاوکردنەوەی وانە",
      resources: sharedText.ku.labels.resources,
      blockers: {
        NO_CONTENT: "جۆری ناوەڕۆکی سەرەکی هەڵبژێرە.",
        VIDEO_NOT_READY: "ڤیدیۆیەکی ئامادە ببەستەوە.",
        DOCUMENT_NOT_READY: "PDF ـێکی ئامادە و ژمارەی پەڕەی دروست ببەستەوە.",
        ARTICLE_EMPTY: "ناوەڕۆکی وتار زیاد بکە.",
        QUIZ_NOT_CONFIGURED:
          "پێش بڵاوکردنەوەی وانەکە، وەشانێکی دروستی تاقیکردنەوە بڵاوبکەرەوە.",
      },
    },
    errors: {
      requestFailed: "داواکارییەکە جێبەجێ نەکرا.",
      invalidMp4: "ڤیدیۆی MP4 دروست هەڵبژێرە.",
      invalidPdf: "بەڵگەنامەی PDF دروست هەڵبژێرە.",
      uploadFailed: "بارکردنی فایل شکستی هێنا.",
    },
    contentTypes: {
      VIDEO: "ڤیدیۆ",
      DOCUMENT: "بەڵگەنامە",
      ARTICLE: "وتار",
      QUIZ: "تاقیکردنەوە",
    },
  },
  ar: {
    title: "محرر الدرس",
    subtitle: "إدارة معلومات الدرس والمحتوى الرئيسي والموارد وجاهزية النشر.",
    tabs: {
      general: "عام",
      content: "المحتوى",
      resources: sharedText.ar.labels.resources,
      review: "المراجعة",
    },
    backToCourse: "العودة إلى محرر الدورة",
    save: "حفظ التغييرات",
    saving: sharedText.ar.actions.saving,
    saved: "تم حفظ التغييرات.",
    general: {
      title: "عنوان الدرس",
      description: "الوصف المنسق",
      status: "الحالة",
      draft: "مسودة",
      published: "منشور",
      archived: sharedText.ar.status.archived,
    },
    content: {
      title: "المحتوى الرئيسي للدرس",
      help: "اختر نوع محتوى رئيسي واحد فقط لهذا الدرس.",
      noContent: "لم يتم إعداد محتوى رئيسي بعد.",
      chooseType: "نوع المحتوى",
      video: "فيديو",
      document: "مستند",
      article: "مقال",
      quiz: sharedText.ar.labels.quiz,
      videoHelp:
        "تشغيل فيديو محمي من التخزين المحلي أو معالجة AWS الآلية أو رابط جاهز.",
      documentHelp: "ارفع ملف PDF خاصاً واعرضه صفحة بصفحة.",
      articleHelp: "أنشئ محتوى درس منسقاً متعدد اللغات.",
      quizHelp: "محتوى الاختبار محجوز لمرحلة الاختبارات اللاحقة.",
      source: "مصدر الفيديو",
      local: "فيديو محلي",
      aws: "فيديو AWS",
      url: "URL",
      localHelp: "حفظ MP4 بشكل خاص على خادم المنصة وتشغيله بنطاق HTTP محمي.",
      awsHelp: "الرفع مباشرة إلى S3 ثم إنشاء HLS تلقائياً بواسطة MediaConvert.",
      urlHelp: "تسجيل رابط تشغيل HTTPS/HLS جاهز.",
      chooseMp4: sharedText.ar.labels.chooseMp4,
      choosePdf: sharedText.ar.labels.choosePdf,
      upload: "رفع الفيديو",
      uploadProcess: sharedText.ar.labels.uploadProcess,
      attachDocument: "إرفاق المستند",
      playbackUrl: "رابط التشغيل",
      advancedMetadata: "بيانات متقدمة",
      sourceSize: sharedText.ar.labels.sourceSize,
      processedSize: sharedText.ar.labels.processedSize,
      duration: uiChrome.ar.duration,
      width: sharedText.ar.labels.width,
      height: sharedText.ar.labels.height,
      ready: "جاهز",
      processing: sharedText.ar.status.processing,
      uploading: "جارٍ الرفع",
      failed: "فشل",
      notReady: "غير جاهز",
      clear: "مسح المحتوى الرئيسي",
      confirmSwitch:
        "تغيير نوع المحتوى سيؤدي إلى فصل المحتوى الرئيسي الحالي. هل تريد المتابعة؟",
      quizReserved:
        "تم حجز الاختبار للمرحلة اللاحقة. لا يمكن نشر درس من نوع Quiz قبل ربط محرك الاختبارات.",
      articleSave: "حفظ المقال",
      dropTitle: "اسحب ملف MP4 وأسقطه هنا",
      dropHelp: "أو اختره من جهازك",
      browseVideo: "اختيار فيديو",
      replaceVideo: "استبدال الفيديو",
      removeSelection: "إزالة الاختيار",
      maxUploadHint: "MP4 · الحد الأقصى للحجم حسب إعدادات المنصة",
      videoDetails: "معلومات الفيديو",
      thumbnail: "الصورة المصغرة",
      thumbnailHelp:
        "يتم إنشاء صورة مصغرة تلقائياً لملفات MP4 المرفوعة، ويمكن استبدالها بصورة JPEG أو PNG أو WebP.",
      changeThumbnail: "تغيير الصورة المصغرة",
      autoThumbnail: "صورة مصغرة تلقائية",
      deleteVideo: "حذف الفيديو",
      confirmDeleteVideo:
        "حذف هذا الفيديو والوسائط المخزنة الخاصة به؟ لا يمكن التراجع عن ذلك.",
      retryProcessing: "إعادة المعالجة",
      uploadProgress: "رفع الفيديو",
      processingProgress: "معالجة الفيديو",
      finalizing: "إنهاء تجهيز الوسائط",
      playback: "التشغيل",
      available: "متاح",
      unavailable: "غير متاح",
      originalSize: "الحجم الأصلي",
      processedSizeLabel: "الحجم بعد المعالجة",
      resolution: sharedText.ar.labels.resolution,
      variants: "نسخ HLS",
      sourceLabel: "المصدر",
      uploadComplete: "اكتمل الرفع",
      processingStarted: "اكتمل الرفع وبدأت معالجة MediaConvert.",
      failedHelp: "فشلت المعالجة. أعد معالجة الملف الحالي أو استبدل الفيديو.",
      dismiss: "إغلاق",
      stepSelect: "اختيار الفيديو",
      stepUpload: "الرفع",
      stepProcess: "المعالجة",
      stepFinalize: "الإنهاء",
      stepReady: "جاهز",
      stepConfigure: "الإعداد",
      stepValidate: "التحقق",
      stepSelectHelp: "اختر المصدر وجهّز الفيديو.",
      currentContent: "المحتوى الحالي",
      changeContentType: "تغيير نوع المحتوى",
      cancelChangeType: "إلغاء",
      removePrimaryContent: "إزالة المحتوى الأساسي",
      videoWorkspace: "محتوى الفيديو",
      videoWorkspaceHelp: "إدارة مصدر الفيديو والرفع ودورة المعالجة والتسليم.",
      currentVideo: "الفيديو الحالي",
      currentVideoHelp: "هذا الفيديو جاهز ومتاح للتشغيل المحمي.",
      processingFailedTitle: "فشلت معالجة الفيديو",
      protectedHls: "HLS محمي",
      protectedMp4: "MP4 محمي",
      externalHls: "HLS/CDN خارجي",
      saveThumbnail: "حفظ الصورة المصغرة",
      thumbnailUpdated: "تم تحديث الصورة المصغرة للفيديو.",
      videoDeleted: "تم حذف الفيديو.",
      videoReadyToast: "اكتمل رفع الفيديو وأصبح جاهزاً.",
      replacingVideo: "استبدال الفيديو الحالي",
      replacingVideoHelp: "اختر مصدر الاستبدال وارفع فيديو جديداً.",
      cancelReplace: "إلغاء الاستبدال",
      uploadReplacement: "رفع الفيديو البديل",
      uploadReplacementProcess: "رفع ومعالجة الفيديو البديل",
      awsLockedHelp:
        "سير عمل AWS قيد التنفيذ. يتم قفل المصدر واختيار الملف حتى انتهاء المعالجة.",
      localLockedHelp:
        "رفع الفيديو المحلي قيد التنفيذ. يتم قفل المصدر واختيار الملف حتى يكتمل.",
    },
    resources: {
      title: "موارد الدرس",
      help: "أرفق ملفات إضافية ليتمكن المتعلمون المخولون من تنزيلها.",
      add: "إضافة مورد",
      chooseFile: "اختيار ملف",
      displayTitle: "عنوان العرض",
      customerVisible: "ظاهر للعميل",
      save: "حفظ",
      remove: sharedText.ar.actions.remove,
      moveUp: "نقل للأعلى",
      moveDown: "نقل للأسفل",
      empty: "لا توجد موارد مرفقة بهذا الدرس.",
    },
    review: {
      title: "جاهزية النشر",
      ready: "هذا الدرس جاهز للنشر.",
      notReady: "ما زالت هناك متطلبات تمنع النشر.",
      publish: "نشر الدرس",
      resources: sharedText.ar.labels.resources,
      blockers: {
        NO_CONTENT: "اختر نوع المحتوى الرئيسي.",
        VIDEO_NOT_READY: "أرفق فيديو جاهزاً.",
        DOCUMENT_NOT_READY: "أرفق مستند PDF جاهزاً بعدد صفحات صحيح.",
        ARTICLE_EMPTY: "أضف محتوى المقال.",
        QUIZ_NOT_CONFIGURED:
          "انشر إصداراً صالحاً من الاختبار قبل نشر هذا الدرس.",
      },
    },
    errors: {
      requestFailed: "تعذر إكمال الطلب.",
      invalidMp4: "اختر ملف فيديو MP4 صالحاً.",
      invalidPdf: "اختر مستند PDF صالحاً.",
      uploadFailed: "فشل رفع الملف.",
    },
    contentTypes: {
      VIDEO: "فيديو",
      DOCUMENT: "مستند",
      ARTICLE: "مقال",
      QUIZ: "اختبار",
    },
  },
};
