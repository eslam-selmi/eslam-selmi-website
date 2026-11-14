import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  Bot, Mail, Palette, Trello, Table2, Wand2, FileText, Presentation, Video, MessageSquare,
  Calendar, BarChart3, Cloud, Database, Code2, Globe2, Users, ListChecks, ClipboardList,
  Megaphone, Camera, PenTool, Brain, Search, Lock, FolderKanban, Mic, Languages, Calculator,
  Target, Sparkles, type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const GRADUATE_TOOLS_KEY = "graduates.tools";
export type GraduateTool = { ar: string; en: string };

export const DEFAULT_GRADUATE_TOOLS: GraduateTool[] = [
  { ar: "الذكاء الاصطناعي", en: "AI at work" },
  { ar: "Outlook باحتراف", en: "Outlook mastery" },
  { ar: "تصميم Canva", en: "Canva design" },
  { ar: "Trello والمهام", en: "Trello & tasks" },
  { ar: "Sheets و Forms", en: "Sheets & Forms" },
  { ar: "أدوات أخرى", en: "More essentials" },
];

// Ordered: first matching rule wins.
const RULES: [RegExp, LucideIcon][] = [
  [/ذكاء|ai\b|\bai |chatgpt|gpt|gemini|copilot|claude|بوت|bot/i, Bot],
  [/outlook|gmail|بريد|ايميل|إيميل|email|mail/i, Mail],
  [/canva|تصميم|design|photoshop|figma|فوتوشوب/i, Palette],
  [/trello|asana|jira|notion|مهام|task|kanban/i, Trello],
  [/excel|sheet|اكسل|إكسل|شيت|جداول|spreadsheet/i, Table2],
  [/form|استبيان|نماذج|survey/i, ClipboardList],
  [/word|وورد|docs|مستند|كتابة|writing/i, FileText],
  [/powerpoint|بوربوينت|عرض|present|slides/i, Presentation],
  [/zoom|teams|meet|فيديو|video|مونتاج/i, Video],
  [/slack|whatsapp|واتساب|تواصل|communicat|chat/i, MessageSquare],
  [/calendar|تقويم|وقت|time|مواعيد/i, Calendar],
  [/power ?bi|tableau|تحليل|analy|dashboard|بيانات|data/i, BarChart3],
  [/drive|onedrive|cloud|سحاب/i, Cloud],
  [/sql|database|قاعدة/i, Database],
  [/code|برمج|python|html|developer/i, Code2],
  [/linkedin|لينكد|سيرة|cv|resume|مقابل|interview/i, Users],
  [/مشروع|project/i, FolderKanban],
  [/تسويق|marketing|social|سوشيال/i, Megaphone],
  [/تصوير|photo|camera/i, Camera],
  [/رسم|draw|illustrat/i, PenTool],
  [/تفكير|think|حل المشكلات|problem/i, Brain],
  [/بحث|search|google/i, Search],
  [/أمن|امن|security|password/i, Lock],
  [/podcast|بودكاست|صوت|audio/i, Mic],
  [/لغة|إنجليزي|انجليزي|english|language|ترجمة/i, Languages],
  [/محاسب|account|مالية|finance/i, Calculator],
  [/هدف|goal|kpi|أداء|performance/i, Target],
  [/قائمة|checklist|تنظيم|organ/i, ListChecks],
  [/web|موقع|انترنت|internet/i, Globe2],
  [/أخرى|اخرى|more|other/i, Wand2],
];

export function iconForTool(tool: GraduateTool): LucideIcon {
  const text = `${tool.ar} ${tool.en}`;
  return RULES.find(([re]) => re.test(text))?.[1] ?? Sparkles;
}

export function parseGraduateTools(content: unknown): GraduateTool[] {
  const list = (content as { tools?: unknown })?.tools;
  if (!Array.isArray(list)) return DEFAULT_GRADUATE_TOOLS;
  return list
    .filter((x): x is GraduateTool => !!x && typeof x.ar === "string")
    .map((x) => ({ ar: x.ar.trim(), en: (typeof x.en === "string" ? x.en : "").trim() }))
    .filter((x) => x.ar || x.en);
}

export const graduateToolsOptions = queryOptions({
  queryKey: ["graduate-tools"],
  staleTime: 30_000,
  queryFn: async () => {
    const { data, error } = await supabase.from("site_content").select("content").eq("section_key", GRADUATE_TOOLS_KEY).maybeSingle();
    if (error) throw error;
    return parseGraduateTools(data?.content);
  },
});
export const useGraduateTools = () => useQuery(graduateToolsOptions);
