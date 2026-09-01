import assert from "node:assert/strict";
import test from "node:test";

import {
  badEndings,
  stageDifficulties,
} from "../lib/game-balance.js";

test("raises every major difficulty axis from stage 1 through stage 6", () => {
  assert.equal(stageDifficulties.length, 6);

  for (let index = 1; index < stageDifficulties.length; index += 1) {
    const previous = stageDifficulties[index - 1];
    const current = stageDifficulties[index];

    assert.ok(current.collisionDamage > previous.collisionDamage);
    assert.ok(current.hazardRows >= previous.hazardRows);
    assert.ok(current.spawnInterval < previous.spawnInterval);
    assert.ok(current.speedBonus > previous.speedBonus);
  }
});

test("gives every stage a distinct explicit bad ending", () => {
  assert.equal(badEndings.length, 6);
  assert.equal(new Set(badEndings.map((ending) => ending.title)).size, 6);

  for (const ending of badEndings) {
    assert.match(ending.code, /^BAD END/);
    assert.ok(ending.title.length > 0);
    assert.ok(ending.story.length >= 20);
  }
});
