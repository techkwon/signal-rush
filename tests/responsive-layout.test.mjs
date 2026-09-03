import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("provides compact HUD layouts for tablets and phones", () => {
  assert.match(css, /@media\(max-width:900px\).*\.route-navigator\{top:70px/s);
  assert.match(css, /@media\(max-width:620px\).*\.challenge-hud\{top:252px/s);
  assert.match(css, /@media\(max-width:380px\).*\.live-controls button\{width:84px/s);
});

test("provides a short-screen layout for low-resolution landscape devices", () => {
  assert.match(css, /@media\(max-height:640px\) and \(min-width:621px\)/);
  assert.match(css, /\.radio-line\{bottom:76px/);
  assert.match(css, /\.stage-review article\{padding:20px 26px/);
});
