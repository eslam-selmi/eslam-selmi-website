import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pencil, X, RotateCcw, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent, invalidateSiteContent } from "@/lib/site-content";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouterState } from "@tanstack/react-router";
import { translateTexts } from "@/lib/translate.functions";

const PRIVATE = ["/admin", "/portal", "/trainer", "/account", "/auth", "/onboarding", "/verify"];

/** Path of child indexes from root to a text node, so the same spot can be found after a language switch. */
function nodePath(root: Node, n: Node): number[] | null {
  const path: number[] = [];
  let cur: Node | null = n;
  while (cur && cur !== root) {
    const p: Node | null = cur.parentNode;
    if (!p) return null;
    path.unshift(Array.prototype.indexOf.call(p.childNodes, cur));
    cur = p;
  }
  return cur === root ? path : null;
}
function nodeAt(root: Node, path: number[]): Node | null {
  let cur: Node | null = root;
  for (const i of path) { cur = cur?.childNodes[i] ?? null; if (!cur) return null; }
  return cur;
}

const KEY = "home.text_overrides";
type Overrides = { ar: Record<string, string>; en: Record<string, string> };

/**
 * Lets the admin replace any visible text on the page. Overrides are keyed by the
 * original text per language and applied to rendered text nodes (re-applied on re-render).
 */
export function TextEditLayer({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  if (PRIVATE.some((p) => pathname.startsWith(p))) return <>{children}</>;
  return <TextEditInner>{children}</TextEditInner>;
}

function TextEditInner({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { lang, setLang } = useI18n();
  const { get } = useSiteContent();
  const overrides = get<Overrides>(KEY, { ar: {}, en: {} });
  const map: Record<string, string> = (overrides[lang as "ar" | "en"] as Record<string, string>) || {};
  const originals = useRef(new WeakMap<Text, string>());
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState<{ original: string; value: string; path: number[] | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: ok } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
      setIsAdmin(!!ok);
    });
  }, []);

  // Apply overrides to text nodes, and keep applying as React re-renders.
  const mapJson = JSON.stringify(map);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const m: Record<string, string> = JSON.parse(mapJson);
    const applyNode = (n: Text) => {
      const known = originals.current.get(n);
      const cur = n.data;
      let orig = known;
      if (known === undefined || (cur !== known && cur.trim() !== (m[known.trim()] ?? "").trim())) {
        orig = cur;
        originals.current.set(n, cur);
      }
      const key = (orig as string).trim();
      if (!key) return;
      const next = m[key];
      const want = next !== undefined ? (orig as string).replace(key, next) : (orig as string);
      if (n.data !== want) n.data = want;
    };
    const walk = (el: Node) => {
      if (el.nodeType === 3) return applyNode(el as Text);
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let t: Node | null;
      while ((t = w.nextNode())) applyNode(t as Text);
    };
    walk(root);
    const mo = new MutationObserver((muts) => {
      mo.disconnect();
      for (const mu of muts) {
        if (mu.type === "characterData") applyNode(mu.target as Text);
        mu.addedNodes.forEach(walk);
      }
      mo.observe(root, { subtree: true, childList: true, characterData: true });
    });
    mo.observe(root, { subtree: true, childList: true, characterData: true });
    return () => mo.disconnect();
  }, [mapJson, lang]);

  // In edit mode, clicking any text opens the editor instead of following links.
  useEffect(() => {
    const root = ref.current;
    if (!root || !editing) return;
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("[data-text-edit-ui]")) return;
      const textNode = Array.from(el.childNodes).find((c) => c.nodeType === 3 && c.textContent?.trim()) as Text | undefined;
      if (!textNode) return;
      e.preventDefault();
      e.stopPropagation();
      const original = (originals.current.get(textNode) ?? textNode.data).trim();
      setTarget({ original, value: map[original] ?? original, path: nodePath(root, textNode) });
    };
    root.addEventListener("click", onClick, true);
    root.classList.add("text-edit-mode");
    return () => { root.removeEventListener("click", onClick, true); root.classList.remove("text-edit-mode"); };
  }, [editing, mapJson]);

  const persist = async (next: Record<string, string>, other?: { lang: "ar" | "en"; map: Record<string, string> }) => {
    const content = { ...overrides, [lang]: next, ...(other ? { [other.lang]: other.map } : {}) };
    const { data: row } = await supabase.from("site_content").select("id").eq("section_key", KEY).maybeSingle();
    const res = row
      ? await supabase.from("site_content").update({ content }).eq("id", row.id)
      : await supabase.from("site_content").insert({ section_key: KEY, label: "Homepage texts", content, is_visible: true });
    if (res.error) return toast.error(res.error.message);
    invalidateSiteContent();
    toast.success(lang === "ar" ? "تم الحفظ" : "Saved");
  };

  const ar = lang === "ar";
  const save = async () => {
    if (!target) return;
    const next = { ...map };
    const v = target.value.trim();
    if (!v || v === target.original) delete next[target.original];
    else next[target.original] = v;
    setSaving(true);
    try {
      // Find the same text in the other language by switching briefly, then auto-translate.
      const otherLang: "ar" | "en" = lang === "ar" ? "en" : "ar";
      let other: { lang: "ar" | "en"; map: Record<string, string> } | undefined;
      const root = ref.current;
      if (root && target.path) {
        setLang(otherLang);
        await new Promise((r) => setTimeout(r, 400));
        const n = nodeAt(root, target.path);
        const otherOrig = n && n.nodeType === 3 ? (originals.current.get(n as Text) ?? (n as Text).data).trim() : "";
        setLang(lang);
        await new Promise((r) => setTimeout(r, 100));
        if (otherOrig && otherOrig !== target.original) {
          const otherMap = { ...((overrides[otherLang] as Record<string, string>) || {}) };
          if (!v || v === target.original) delete otherMap[otherOrig];
          else {
            const res = await translateTexts({ data: { texts: [v], target: otherLang } }).catch(() => null);
            const tr = res?.translations?.[0];
            if (tr && !res?.error) otherMap[otherOrig] = tr;
          }
          other = { lang: otherLang, map: otherMap };
        }
      }
      await persist(next, other);
      if (!other) toast.message(ar ? "لم يتم العثور على النص المقابل في اللغة الأخرى" : "Matching text in the other language not found");
    } finally {
      setSaving(false);
      setTarget(null);
    }
  };

  const entries = Object.entries(map);

  return (
    <div ref={ref}>
      {children}
      {isAdmin && (
        <div data-text-edit-ui className="fixed bottom-24 start-5 z-[60] flex flex-col gap-2">
          {editing && (
            <Button size="sm" variant="secondary" onClick={() => setListOpen(true)}>
              {ar ? `النصوص المعدّلة (${entries.length})` : `Edited texts (${entries.length})`}
            </Button>
          )}
          <Button size="sm" onClick={() => setEditing((v) => !v)} className="shadow-lg">
            {editing ? <X className="size-4" /> : <Pencil className="size-4" />}
            {editing ? (ar ? "إنهاء التعديل" : "Stop editing") : (ar ? "تعديل النصوص" : "Edit texts")}
          </Button>
        </div>
      )}

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent data-text-edit-ui>
          <DialogHeader><DialogTitle>{ar ? "تعديل النص" : "Edit text"}</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">{ar ? "النص الأصلي:" : "Original:"} {target?.original}</p>
          <Textarea rows={4} value={target?.value ?? ""} onChange={(e) => setTarget((t) => t && { ...t, value: e.target.value })} />
          <p className="text-xs text-muted-foreground">
            {ar ? "سيتم ترجمة التعديل تلقائياً للغة الأخرى." : "The edit is auto-translated to the other language."}
          </p>
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => target && setTarget({ ...target, value: target.original })}>
              <RotateCcw className="size-4" /> {ar ? "استرجاع الأصلي" : "Restore original"}
            </Button>
            <Button onClick={save} disabled={saving}><Save className="size-4" /> {ar ? "حفظ" : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent data-text-edit-ui className="max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{ar ? "النصوص المعدّلة" : "Edited texts"}</DialogTitle></DialogHeader>
          {entries.length === 0 && <p className="text-sm text-muted-foreground">{ar ? "لا توجد تعديلات بعد." : "No edits yet."}</p>}
          {entries.map(([o, v]) => (
            <div key={o} className="rounded-lg border border-border p-3 text-sm space-y-1">
              <div className="text-muted-foreground line-through">{o}</div>
              <div>{v}</div>
              <Button size="sm" variant="outline" onClick={() => { const n = { ...map }; delete n[o]; persist(n); }}>
                <RotateCcw className="size-4" /> {ar ? "استرجاع" : "Restore"}
              </Button>
            </div>
          ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
