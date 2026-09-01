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

test("keeps the final three stages clearable without a difficulty spike", () => {
  const stageFour = stageDifficulties[3];
  const stageFive = stageDifficulties[4];
  const stageSix = stageDifficulties[5];

  assert.ok(stageFour.collisionDamage <= 14);
  assert.ok(stageFive.collisionDamage <= 15);
  assert.ok(stageSix.collisionDamage <= 17);
  assert.ok(stageFour.hazardRows <= 3);
  assert.ok(stageFive.hazardRows <= 4);
  assert.ok(stageSix.hazardRows <= 4);
  assert.ok(stageFour.spawnInterval >= 1.8);
  assert.ok(stageFive.spawnInterval >= 1.7);
  assert.ok(stageSix.spawnInterval >= 1.6);
  assert.ok(stageFour.repairAmount >= 7);
  assert.ok(stageFive.repairAmount >= 10);
  assert.ok(stageSix.repairAmount >= 14);
  assert.ok(stageFour.criticalDamageScale <= .85);
  assert.ok(stageFive.criticalDamageScale <= .8);
  assert.ok(stageSix.criticalDamageScale <= .75);
});
