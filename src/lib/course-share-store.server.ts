/**
 * DRAFT service-role store for course-share-service. Not imported by any route yet.
 * The table course_share_links does not exist until the reviewed SQL is applied, so the
 * generated types do not know it: it is accessed through a loose client type on purpose.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ShareStore } from "./course-share-service";
import { parseVideoCues } from "./video-cues";
import type { ShareLinkRow } from "./course-share-core";

type Loose = { from: (t: string) => any };
const db = () => supabaseAdmin as unknown as Loose;
const COLS = "id,course_id,token_hash,expires_at,revoked_at,auto_close,bind_first,claim_hash,closed_at";

export const supabaseShareStore: ShareStore = {
  async findByTokenHash(hash) {
    const { data, error } = await db().from("course_share_links").select(COLS).eq("token_hash", hash).maybeSingle();
    if (error) throw new Error("share lookup failed");
    return (data as ShareLinkRow | null) ?? null;
  },
  async insert(row) {
    const { data, error } = await db().from("course_share_links").insert(row).select(COLS).single();
    if (error) throw new Error("share create failed");
    return data as ShareLinkRow;
  },
  async claim(id, claimHash) {
    // atomic: only wins while claim_hash is still null
    const { data, error } = await db().from("course_share_links").update({ claim_hash: claimHash }).eq("id", id).is("claim_hash", null).select("id");
    if (error) throw new Error("share claim failed");
    return Array.isArray(data) && data.length === 1;
  },
  async markClosed(id, at) {
    const { error } = await db().from("course_share_links").update({ closed_at: at }).eq("id", id);
    if (error) throw new Error("share close failed");
  },
  async revoke(id, at) {
    const { error } = await db().from("course_share_links").update({ revoked_at: at }).eq("id", id);
    if (error) throw new Error("share revoke failed");
  },
  async loadCourseItems(courseId) {
    // Read-only. Items live in module_items under course_modules; cues are stored inside module_items.content.
    const { data: mods, error: e1 } = await db().from("course_modules").select("id,order_index").eq("course_id", courseId).order("order_index");
    if (e1) throw new Error("share items failed");
    const ids = ((mods as { id: string }[]) ?? []).map((m) => m.id);
    if (!ids.length) return { items: [], cueCounts: {} };
    const { data: rows, error: e2 } = await (supabaseAdmin as unknown as { from: (t: string) => any })
      .from("module_items").select("id,kind,content").in("module_id", ids);
    if (e2) throw new Error("share items failed");
    const items = ((rows as { id: string; kind: string; content: string | null }[]) ?? []).map((r) => ({ id: r.id, kind: r.kind, content: r.content }));
    const cueCounts: Record<string, number> = {};
    for (const it of items) if (it.kind === "video") cueCounts[it.id] = parseVideoCues(it.content).length;
    return { items, cueCounts };
  },
  async list() {
    const { data, error } = await db().from("course_share_links").select(COLS + ",created_at,courses(title)").order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error("share list failed");
    return ((data as any[]) ?? []).map((r) => ({ ...r, course_title: r.courses?.title ?? "" }));
  },
  async loadCourseContent(courseId) {
    const { data: course } = await db().from("courses").select("title,description").eq("id", courseId).maybeSingle();
    const { data: mods, error } = await db().from("course_modules").select("id,title,order_index").eq("course_id", courseId).order("order_index");
    if (error) throw new Error("share content failed");
    const ids = ((mods as { id: string }[]) ?? []).map((m) => m.id);
    const { data: rows } = ids.length ? await db().from("module_items").select("id,module_id,kind,title,url,content,order_index").in("module_id", ids).order("order_index") : { data: [] };
    const storage = (supabaseAdmin as unknown as { storage: { from: (b: string) => { createSignedUrl: (p: string, s: number) => Promise<{ data: { signedUrl: string } | null }> } } }).storage;
    const items = await Promise.all(((rows as any[]) ?? []).map(async (it) => {
      let url: string | null = it.url ?? null;
      if (url && ["file", "video", "pdf"].includes(it.kind) && !/^https?:\/\//i.test(url)) {
        const { data } = await storage.from("course-files").createSignedUrl(url, 1800);
        url = data?.signedUrl ?? null;
      }
      // content only where it is learner-facing: video question data, notes and text. Anything else is not sent.
      // Lectures stored as a link or file (the TNA unit videos) carry their questions too; only content that starts with the cue marker is sent for them.
      const content = ["video", "note", "text"].includes(it.kind) || (["link", "file"].includes(it.kind) && typeof it.content === "string" && it.content.startsWith("[[video-cues:v1]]")) ? (it.content ?? null) : null;
      return { id: it.id, module_id: it.module_id, kind: it.kind, title: it.title, url, content };
    }));
    return {
      title: course?.title ?? "", description: course?.description ?? "",
      modules: ((mods as any[]) ?? []).map((m) => ({ id: m.id, title: m.title, items: items.filter((i) => i.module_id === m.id).map(({ module_id, ...i }) => i) })),
    };
  },
};
