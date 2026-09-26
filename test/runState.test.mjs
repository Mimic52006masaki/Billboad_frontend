import test from 'node:test';
import assert from 'node:assert/strict';
import { checkpointDue, checkpoints, nextRank } from '../src/lib/runState.mjs';

test('連続検証済みの次順位を返す', () => {
  assert.equal(nextRank(0), 1);
  assert.equal(nextRank(42), 43);
  assert.equal(nextRank(60), null);
});

test('完了とみなす曲数を指定できる', () => {
  assert.equal(nextRank(50, 100), 51);
  assert.equal(nextRank(50, 50), null);
  assert.equal(nextRank(60, 100), 61);
});

test('10曲ごとだけチェックポイントとする', () => {
  assert.equal(checkpointDue(10), true);
  assert.equal(checkpointDue(11), false);
  assert.equal(checkpointDue(60), true);
});

test('チェックポイントは指定した曲数まで刻む', () => {
  assert.deepEqual(checkpoints(50), [10, 20, 30, 40, 50]);
  assert.deepEqual(checkpoints(100), [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  assert.equal(checkpointDue(70, 100), true);
  assert.equal(checkpointDue(70, 60), false);
});
