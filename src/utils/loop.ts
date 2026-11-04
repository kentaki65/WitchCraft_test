export function createTickInterval(
  interval: number,
  callback: () => void
): () => void {
  let tickCount = 0;

  return () => {
    tickCount++;

    if (tickCount % interval === 0) {
      callback();
    }
  };
}