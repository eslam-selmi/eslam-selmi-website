import { test } from "node:test";
import { strict as assert } from "node:assert";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
assert.ok(url && key, "Public content integration checks require the project configuration");
const visitor = createClient<Database>(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

test("signed-out visitors can read the active homepage partners", async () => {
  const { data, error } = await visitor.from("partners").select("id,is_active");
  assert.equal(error, null);
  assert.ok(data && data.length > 0);
  assert.ok(data.every((row) => row.is_active === true));
});

test("signed-out visitors can read the active career journey", async () => {
  const { data, error } = await visitor.from("contracts").select("id,is_active");
  assert.equal(error, null);
  assert.ok(data && data.length > 0);
  assert.ok(data.every((row) => row.is_active === true));
});

test("signed-out visitors can read only published interviews", async () => {
  const { data, error } = await visitor.from("interviews").select("id,is_published");
  assert.equal(error, null);
  assert.ok(data);
  assert.ok(data.every((row) => row.is_published === true));
});

test("signed-out visitors can read only visible snapshots", async () => {
  const { data, error } = await visitor.from("snapshots").select("id,is_visible");
  assert.equal(error, null);
  assert.ok(data);
  assert.ok(data.every((row) => row.is_visible === true));
});

test("signed-out visitors can read only published trainings", async () => {
  const { data, error } = await visitor.from("trainings").select("id,is_published");
  assert.equal(error, null);
  assert.ok(data);
  assert.ok(data.every((row) => row.is_published === true));
});

test("public site content excludes hidden text but retains maintenance configuration", async () => {
  const { data, error } = await visitor.from("site_content").select("section_key,is_visible");
  assert.equal(error, null);
  assert.ok(data?.length);
  assert.ok(data.every((row) => row.is_visible || row.section_key === "site.maintenance"));
  const flags = await visitor.rpc("get_public_site_visibility");
  assert.equal(flags.error, null);
  assert.ok(flags.data?.length);
  assert.ok(flags.data.every((row) => Object.keys(row).sort().join(",") === "is_visible,section_key"));
});

test("public country choices omit creator metadata and direct table reads are denied", async () => {
  const direct = await visitor.from("custom_countries").select("*");
  assert.ok(direct.error);
  const choices = await visitor.rpc("get_public_custom_countries");
  assert.equal(choices.error, null);
  assert.ok(choices.data);
  assert.ok(choices.data.every((row) => Object.keys(row).sort().join(",") === "dial,flag,id,name_ar,name_en"));
});

test("public additions and settings respect their homepage section visibility", async () => {
  const flags = await visitor.rpc("get_public_site_visibility");
  assert.equal(flags.error, null);
  const visible = flags.data?.some((row) => row.section_key === "home.latest_additions" && row.is_visible);
  for (const table of ["latest_additions", "latest_additions_settings"] as const) {
    const result = await visitor.from(table).select("id");
    assert.equal(result.error, null);
    assert.ok(result.data);
    if (!visible) assert.equal(result.data.length, 0);
  }
});

test("anonymous callers cannot list private public-uploads files", async () => {
  const { data, error } = await visitor.storage.from("public-uploads").list("", { limit: 10 });
  assert.ok(error || data?.length === 0);
});