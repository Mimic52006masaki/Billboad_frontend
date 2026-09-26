export const CHECKPOINT_INTERVAL = 10;
export function checkpoints(targetCount = 60) {
  return Object.freeze([...Array(Math.floor(targetCount / CHECKPOINT_INTERVAL)).keys()].map(index => (index + 1) * CHECKPOINT_INTERVAL));
}
export function nextRank(verifiedPrefix, targetCount = 60) { return verifiedPrefix >= targetCount ? null : verifiedPrefix + 1; }
export function checkpointDue(verifiedPrefix, targetCount = 60) { return checkpoints(targetCount).includes(verifiedPrefix); }
