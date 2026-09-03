import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("provides compact HUD layouts for tablets and phones", () => {
  assert.match(css, /@media\(max-width:900px\).*\.route-navigator\{top:70px/s);
  assert.match(css, /@media\(max-width:620px\).*\.challenge-hud\{top:104px/s);
  assert.match(css, /@media\(max-width:380px\).*\.live-controls button\{width:84px/s);
});

test("provides a short-screen layout for low-resolution landscape devices", () => {
  assert.match(css, /@media\(max-height:640px\) and \(min-width:621px\)/);
  assert.match(css, /\.radio-line\{bottom:76px/);
  assert.match(css, /\.stage-review article\{padding:20px 26px/);
});

test("keeps prologue guidance inside the question panel", () => {
  assert.doesNotMatch(page, /className="tutorial-coach"/);
  assert.match(page, /prologueGuide\.eyebrow/);
  assert.match(page, /prologueGuide\.title/);
  assert.match(css, /\.challenge-hud\{top:178px/);
});

test("reserves the center playfield on phones", () => {
  assert.match(css, /@media\(max-width:620px\).*\.route-track\{display:none/s);
  assert.match(css, /\.energy-hud\{display:none/);
  assert.match(css, /\.fragment-hud\{top:104px;left:8px;width:88px/);
});
