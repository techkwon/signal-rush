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

test("keeps the final two stages challenging without a difficulty spike", () => {
  const stageFive = stageDifficulties[4];
  const stageSix = stageDifficulties[5];

  assert.ok(stageFive.collisionDamage <= 17);
  assert.ok(stageSix.collisionDamage <= 19);
  assert.ok(stageFive.hazardRows <= 4);
  assert.ok(stageSix.hazardRows <= 5);
  assert.ok(stageFive.spawnInterval >= 1.6);
  assert.ok(stageSix.spawnInterval >= 1.5);
  assert.ok(stageFive.repairAmount >= 9);
  assert.ok(stageSix.repairAmount >= 12);
});
