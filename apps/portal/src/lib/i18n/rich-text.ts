import type { Locale } from "@odookrd/types";

import { sharedText } from "./shared";

/**
 * Rich text toolbar labels.
 *
 * Shared rather than owned by training: the editor is used wherever rich
 * content is authored, and "Bold" is not training copy.
 */
export interface RichTextToolbarDictionary {
  paragraph: string;
  heading1: string;
  heading2: string;
  heading3: string;
  bold: string;
  italic: string;
  underline: string;
  strike: string;
  clearFormatting: string;
  indent: string;
  outdent: string;
  resizeEditor: string;
  words: string;
  characters: string;
  table: string;
  tableInsert: string;
  tableAddRowBefore: string;
  tableAddRowAfter: string;
  tableDeleteRow: string;
  tableAddColumnBefore: string;
  tableAddColumnAfter: string;
  tableDeleteColumn: string;
  tableToggleHeaderRow: string;
  tableToggleHeaderColumn: string;
  tableMergeOrSplit: string;
  tableDelete: string;
  videoAlignLeft: string;
  videoAlignCenter: string;
  videoAlignRight: string;
  videoFullWidth: string;
  videoMove: string;
  videoDelete: string;
  videoEditUrl: string;
  wrapLeft: string;
  wrapRight: string;
  bulletList: string;
  orderedList: string;
  blockquote: string;
  codeBlock: string;
  undo: string;
  redo: string;
  image: string;
  attachment: string;
  fullscreen: string;
  exitFullscreen: string;
  uploadFailed: string;
  alignLeft: string;
  alignCenter: string;
  alignRight: string;
  directionLtr: string;
  directionRtl: string;
  separator: string;
  separatorPrompt: string;
  youtube: string;
  youtubePrompt: string;
  youtubeInvalid: string;
  calloutNote: string;
  calloutWarning: string;
  calloutTip: string;
  imageAlignLeft: string;
  imageAlignCenter: string;
  imageAlignRight: string;
  imageMove: string;
  imageDelete: string;
  imageResize: string;
  imageActualSize: string;
  placeholder: string;
  link: string;
  unlink: string;
  linkPrompt: string;
  linkInvalid: string;
  dialogApply: string;
  dialogCancel: string;
  more: string;
  groupHistory: string;
  groupBlocks: string;
  groupMarks: string;
  groupAlignment: string;
  groupLists: string;
  groupInsert: string;
  groupCallouts: string;
  groupLinks: string;
  groupMedia: string;
}

const ku: RichTextToolbarDictionary = {
  videoEditUrl: "گۆڕینی بەستەری ڤیدیۆ",
  wrapLeft: "دەق بپێچێتەوە بە ڕاستیدا (وێنە لە چەپ)",
  wrapRight: "دەق بپێچێتەوە بە چەپیدا (وێنە لە ڕاست)",
  more: "زیاتر",
  groupHistory: "مێژوو",
  groupBlocks: "بلۆک",
  groupMarks: "ڕازاندنەوەی دەق",
  groupAlignment: "ڕیزکردن",
  groupLists: "لیستەکان",
  groupInsert: "زیادکردن",
  groupCallouts: "تێبینییەکان",
  groupLinks: "بەستەرەکان",
  groupMedia: "میدیا",
  heading1: "سەردێڕ ١",
  underline: "هێڵ بەژێر",
  clearFormatting: "سڕینەوەی ڕازاندنەوە",
  indent: "زیادکردنی بۆشایی",
  outdent: "کەمکردنی بۆشایی",
  resizeEditor: "گۆڕینی بەرزی دەستکاریکەر",
  words: "وشە",
  characters: "پیت",
  table: "خشتە",
  tableInsert: "خشتەیەکی نوێ",
  tableAddRowBefore: "ڕیز زیادبکە لە سەرەوە",
  tableAddRowAfter: "ڕیز زیادبکە لە خوارەوە",
  tableDeleteRow: "سڕینەوەی ڕیز",
  tableAddColumnBefore: "ستوون زیادبکە لە پێش",
  tableAddColumnAfter: "ستوون زیادبکە لە دوا",
  tableDeleteColumn: "سڕینەوەی ستوون",
  tableToggleHeaderRow: "ڕیزی سەردێڕ",
  tableToggleHeaderColumn: "ستوونی سەردێڕ",
  tableMergeOrSplit: "تێکەڵکردن یان جیاکردنەوەی خانە",
  tableDelete: "سڕینەوەی خشتە",
  videoAlignLeft: "ڤیدیۆ بۆ چەپ",
  videoAlignCenter: "ڤیدیۆ بۆ ناوەڕاست",
  videoAlignRight: "ڤیدیۆ بۆ ڕاست",
  videoFullWidth: "پانی تەواو (100%)",
  videoMove: "گواستنەوەی ڤیدیۆ",
  videoDelete: "سڕینەوەی ڤیدیۆ",
  paragraph: "پەرەگراف",
  heading2: "سەردێڕ ٢",
  heading3: "سەردێڕ ٣",
  bold: "تۆخ",
  italic: "لار",
  strike: "هێڵ بەسەر",
  bulletList: "لیستی خاڵدار",
  orderedList: "لیستی ژمارەدار",
  blockquote: "وتە",
  codeBlock: "بلۆکی کۆد",
  undo: "پاشگەزبوونەوە",
  redo: "دووبارە",
  image: "بارکردنی وێنە",
  attachment: "هاوپێچکردنی فایل",
  fullscreen: "پڕشاشە",
  exitFullscreen: sharedText.ku.labels.exitFullscreen,
  uploadFailed: "بارکردنی فایل سەرکەوتوو نەبوو.",
  alignLeft: "ڕیزکردن بۆ چەپ",
  alignCenter: "ڕیزکردن بۆ ناوەڕاست",
  alignRight: "ڕیزکردن بۆ ڕاست",
  directionLtr: "ئاڕاستەی LTR",
  directionRtl: "ئاڕاستەی RTL",
  separator: "زیادکردنی هێڵی جیاکەرەوە",
  separatorPrompt: "ناونیشانی هێڵی جیاکەرەوە (ئارەزوومەندانە)",
  youtube: "ڤیدیۆی یوتیوب",
  youtubePrompt: "بەستەری ڤیدیۆی یوتیوب دابنێ",
  youtubeInvalid: "بەستەری یوتیۆب دروست نییە.",
  calloutNote: "تێبینی",
  calloutWarning: "ئاگاداری",
  calloutTip: "ئامۆژگاری",
  imageAlignLeft: "وێنە بۆ چەپ",
  imageAlignCenter: "وێنە بۆ ناوەڕاست",
  imageAlignRight: "وێنە بۆ ڕاست",
  imageMove: "گواستنەوەی وێنە",
  imageDelete: "سڕینەوەی وێنە",
  imageResize: "گۆڕینی قەبارەی وێنە",
  imageActualSize: "قەبارەی ڕاستەقینە (100%)",
  placeholder: "دەست بە نووسین بکە...",
  link: "زیادکردنی بەستەر",
  unlink: "لابردنی بەستەر",
  linkPrompt: "URLی بەستەر بنووسە",
  linkInvalid: "URLی بەستەر دروست نییە.",
  dialogApply: "جێبەجێکردن",
  dialogCancel: "پاشگەزبوونەوە",
};

const ar: RichTextToolbarDictionary = {
  videoEditUrl: "تغيير رابط الفيديو",
  wrapLeft: "التفاف النص (الصورة لليسار)",
  wrapRight: "التفاف النص (الصورة لليمين)",
  more: "المزيد",
  groupHistory: "السجل",
  groupBlocks: "الكتل",
  groupMarks: "تنسيق النص",
  groupAlignment: "المحاذاة",
  groupLists: "القوائم",
  groupInsert: "إدراج",
  groupCallouts: "التنبيهات",
  groupLinks: "الروابط",
  groupMedia: "الوسائط",
  heading1: "عنوان 1",
  underline: "تسطير",
  clearFormatting: "مسح التنسيق",
  indent: "زيادة المسافة البادئة",
  outdent: "تقليل المسافة البادئة",
  resizeEditor: "تغيير ارتفاع المحرر",
  words: "كلمة",
  characters: "حرف",
  table: "جدول",
  tableInsert: "إدراج جدول",
  tableAddRowBefore: "إضافة صف قبل",
  tableAddRowAfter: "إضافة صف بعد",
  tableDeleteRow: "حذف الصف",
  tableAddColumnBefore: "إضافة عمود قبل",
  tableAddColumnAfter: "إضافة عمود بعد",
  tableDeleteColumn: "حذف العمود",
  tableToggleHeaderRow: "صف الرأس",
  tableToggleHeaderColumn: "عمود الرأس",
  tableMergeOrSplit: "دمج أو تقسيم الخلايا",
  tableDelete: "حذف الجدول",
  videoAlignLeft: "محاذاة الفيديو لليسار",
  videoAlignCenter: "توسيط الفيديو",
  videoAlignRight: "محاذاة الفيديو لليمين",
  videoFullWidth: "عرض كامل (100%)",
  videoMove: "نقل الفيديو",
  videoDelete: "حذف الفيديو",
  paragraph: "فقرة",
  heading2: "عنوان 2",
  heading3: "عنوان 3",
  bold: "عريض",
  italic: "مائل",
  strike: "يتوسطه خط",
  bulletList: "قائمة نقطية",
  orderedList: "قائمة مرقمة",
  blockquote: "اقتباس",
  codeBlock: "كتلة كود",
  undo: "تراجع",
  redo: "إعادة",
  image: "رفع صورة",
  attachment: "إرفاق ملف",
  fullscreen: "ملء الشاشة",
  exitFullscreen: sharedText.ar.labels.exitFullscreen,
  uploadFailed: "تعذر رفع الملف.",
  alignLeft: "محاذاة لليسار",
  alignCenter: "توسيط",
  alignRight: "محاذاة لليمين",
  directionLtr: "اتجاه LTR",
  directionRtl: "اتجاه RTL",
  separator: "إدراج فاصل",
  separatorPrompt: "عنوان الفاصل (اختياري)",
  youtube: "فيديو يوتيوب",
  youtubePrompt: "الصق رابط فيديو يوتيوب",
  youtubeInvalid: "رابط يوتيوب غير صالح.",
  calloutNote: "ملاحظة",
  calloutWarning: "تحذير",
  calloutTip: "نصيحة",
  imageAlignLeft: "محاذاة الصورة لليسار",
  imageAlignCenter: "توسيط الصورة",
  imageAlignRight: "محاذاة الصورة لليمين",
  imageMove: "نقل الصورة",
  imageDelete: "حذف الصورة",
  imageResize: "تغيير حجم الصورة",
  imageActualSize: "الحجم الفعلي (100%)",
  placeholder: "ابدأ الكتابة...",
  link: "إضافة رابط",
  unlink: "إزالة الرابط",
  linkPrompt: "أدخل رابط URL",
  linkInvalid: "رابط URL غير صالح.",
  dialogApply: "تطبيق",
  dialogCancel: "إلغاء",
};

const en: RichTextToolbarDictionary = {
  videoEditUrl: "Change video URL",
  wrapLeft: "Wrap text, image left",
  wrapRight: "Wrap text, image right",
  more: "More",
  groupHistory: "History",
  groupBlocks: "Blocks",
  groupMarks: "Text style",
  groupAlignment: "Alignment",
  groupLists: "Lists",
  groupInsert: "Insert",
  groupCallouts: "Callouts",
  groupLinks: "Links",
  groupMedia: "Media",
  heading1: "Heading 1",
  underline: "Underline",
  clearFormatting: "Clear formatting",
  indent: "Indent",
  outdent: "Outdent",
  resizeEditor: "Drag to resize the editor",
  words: "words",
  characters: "characters",
  table: "Table",
  tableInsert: "Insert table",
  tableAddRowBefore: "Add row above",
  tableAddRowAfter: "Add row below",
  tableDeleteRow: "Delete row",
  tableAddColumnBefore: "Add column before",
  tableAddColumnAfter: "Add column after",
  tableDeleteColumn: "Delete column",
  tableToggleHeaderRow: "Toggle header row",
  tableToggleHeaderColumn: "Toggle header column",
  tableMergeOrSplit: "Merge or split cells",
  tableDelete: "Delete table",
  videoAlignLeft: "Align video left",
  videoAlignCenter: "Center video",
  videoAlignRight: "Align video right",
  videoFullWidth: "Full width (100%)",
  videoMove: "Move video",
  videoDelete: "Delete video",
  paragraph: "Paragraph",
  heading2: "Heading 2",
  heading3: "Heading 3",
  bold: "Bold",
  italic: "Italic",
  strike: "Strike",
  bulletList: "Bullet list",
  orderedList: "Numbered list",
  blockquote: "Blockquote",
  codeBlock: "Code block",
  undo: "Undo",
  redo: "Redo",
  image: "Upload image",
  attachment: "Attach file",
  fullscreen: "Full screen",
  exitFullscreen: sharedText.en.labels.exitFullscreen,
  uploadFailed: "The file could not be uploaded.",
  alignLeft: "Align left",
  alignCenter: "Align center",
  alignRight: "Align right",
  directionLtr: "Left-to-right",
  directionRtl: "Right-to-left",
  separator: "Insert separator",
  separatorPrompt: "Separator label (optional)",
  youtube: "YouTube video",
  youtubePrompt: "Paste a YouTube video link",
  youtubeInvalid: "That is not a valid YouTube link.",
  calloutNote: "Note",
  calloutWarning: "Warning",
  calloutTip: "Tip",
  imageAlignLeft: "Align image left",
  imageAlignCenter: "Center image",
  imageAlignRight: "Align image right",
  imageMove: "Move image",
  imageDelete: "Delete image",
  imageResize: "Resize image",
  imageActualSize: "Actual size (100%)",
  placeholder: "Start writing...",
  link: "Insert link",
  unlink: "Remove link",
  linkPrompt: "Enter a URL",
  linkInvalid: "Enter a valid HTTP, HTTPS, or email URL.",
  dialogApply: "Apply",
  dialogCancel: "Cancel",
};

export const richTextToolbarDictionaries: Record<
  Locale,
  RichTextToolbarDictionary
> = { ku, ar, en };
