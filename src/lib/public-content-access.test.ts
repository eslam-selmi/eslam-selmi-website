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