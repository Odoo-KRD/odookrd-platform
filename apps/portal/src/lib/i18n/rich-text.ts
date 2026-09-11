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
  heading2: string;
  heading3: string;
  bold: string;
  italic: string;
  strike: string;
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
}

const ku: RichTextToolbarDictionary = {
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
