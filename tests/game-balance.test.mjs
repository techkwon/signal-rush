import assert from "node:assert/strict";
import test from "node:test";

import {
  badEndings,
  prologueGuides,
  stageDifficulties,
} from "../lib/game-balance.js";

test("raises every major difficulty axis from stage 1 through stage 6", () => {
  assert.equal(stageDifficulties.length, 6);

  for (let index = 1; index < stageDifficulties.length; index += 1) {
    const previous = stageDifficulties[index - 1];
    const current = stageDifficulties[index];

    assert.ok(current.collisionDamage >= previous.collisionDamage);
    assert.ok(current.hazardRows >= previous.hazardRows);
    assert.ok(current.spawnInterval <= previous.spawnInterval);
    assert.ok(current.speedBonus >= previous.speedBonus);
  }

  assert.ok(stageDifficulties.at(-1).collisionDamage > stageDifficulties[0].collisionDamage);
  assert.ok(stageDifficulties.at(-1).speedBonus > stageDifficulties[0].speedBonus);
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

test("makes large-data stages survivable through stronger recovery", () => {
  const stageFive = stageDifficulties[4];
  const stageSix = stageDifficulties[5];

  assert.ok(stageFive.collisionDamage <= 14);
  assert.ok(stageSix.collisionDamage <= 15);
  assert.ok(stageFive.hazardRows <= 3);
  assert.ok(stageSix.hazardRows <= 4);
  assert.ok(stageFive.repairAmount >= 12);
  assert.ok(stageSix.repairAmount >= 16);
  assert.ok(stageFive.repairChance >= .45);
  assert.ok(stageSix.repairChance >= .5);
  assert.ok(stageFive.rescueAmount >= 25);
  assert.ok(stageSix.rescueAmount >= 30);
});

test("uses stage one as a forgiving control-learning prologue", () => {
  const prologue = stageDifficulties[0];

  assert.equal(prologue.label, "프롤로그");
  assert.equal(prologue.hazardRows, 1);
  assert.ok(prologue.collisionDamage <= 4);
  assert.ok(prologue.spawnInterval >= 2.8);
  assert.ok(prologue.criticalDamageScale <= .6);
  assert.equal(prologueGuides.length, 4);
  assert.deepEqual(prologueGuides.map((guide) => guide.eyebrow), [
    "연습 1/4 · 움직이기",
    "연습 2/4 · 수집하기",
    "연습 3/4 · 회피하기",
    "연습 4/4 · 선택하기",
  ]);
});

test("keeps collectible reaction time above 1.3 seconds in every stage", () => {
  for (const difficulty of stageDifficulties) {
    const fastestItemMultiplier = 1 + (stageDifficulties.indexOf(difficulty) + 1) * .018 + .035;
    const reactionSeconds = (4.7 - difficulty.itemSpawnZ) / (difficulty.itemApproachSpeed * fastestItemMultiplier);
    assert.ok(reactionSeconds >= 1.3, `${difficulty.label}: ${reactionSeconds.toFixed(2)} seconds`);
  }
});
