import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pencil, X, RotateCcw, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent, invalidateSiteContent } from "@/lib/site-content";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const KEY = "home.text_overrides";
type Overrides = { ar: Record<string, string>; en: Record<string, string> };

/**
 * Lets the admin replace any visible text on the page. Overrides are keyed by the
 * original text per language and applied to rendered text nodes (re-applied on re-render).
 */
export function TextEditLayer({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { lang } = useI18n();
  const { get } = useSiteContent();
  const overrides = get<Overrides>(KEY, { ar: {}, en: {} });
  const map: Record<string, string> = (overrides[lang as "ar" | "en"] as Record<string, string>) || {};
  const originals = useRef(new WeakMap<Text, string>());
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState<{ original: string; value: string } | null>(null);
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
      setTarget({ original, value: map[original] ?? original });
    };
    root.addEventListener("click", onClick, true);
    root.classList.add("text-edit-mode");
    return () => { root.removeEventListener("click", onClick, true); root.classList.remove("text-edit-mode"); };
  }, [editing, mapJson]);

  const persist = async (next: Record<string, string>) => {
    const content = { ...overrides, [lang]: next };
    const { data: row } = await supabase.from("site_content").select("id").eq("section_key", KEY).maybeSingle();
    const res = row
      ? await supabase.from("site_content").update({ content }).eq("id", row.id)
      : await supabase.from("site_content").insert({ section_key: KEY, label: "Homepage texts", content, is_visible: true });
    if (res.error) return toast.error(res.error.message);
    invalidateSiteContent();
    toast.success(lang === "ar" ? "تم الحفظ" : "Saved");
  };

  const save = async () => {
    if (!target) return;
    const next = { ...map };
    const v = target.value.trim();
    if (!v || v === target.original) delete next[target.original];
    else next[target.original] = v;
    await persist(next);
    setTarget(null);
  };

  const ar = lang === "ar";
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
            {ar ? "التعديل يخص اللغة الحالية فقط. غيّر اللغة لتعديل النسخة الأخرى." : "Applies to the current language only."}
          </p>
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => target && setTarget({ ...target, value: target.original })}>
              <RotateCcw className="size-4" /> {ar ? "استرجاع الأصلي" : "Restore original"}
            </Button>
            <Button onClick={save}><Save className="size-4" /> {ar ? "حفظ" : "Save"}</Button>
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
