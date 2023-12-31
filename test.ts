import PQ from "./index.js";

const pq = new PQ({
  concurrency: 2,
  retry: 2,
  /**
   * @param {number} count
   * @returns {number}
   */
  retryMethod: (count) => (count ** 2 * 1000) * (Math.random() + 1),
  retry_postpone: false,
});

/**
 *
 * @param {number} index
 * @returns {Promise<void>}
 */
function Factory (index) {
  return async () => {
    const wait = Math.random() * 1000 | 0;
    console.log(`[${index}] start ${wait}`);
    await new Promise((resolve) => setTimeout(resolve, wait));
    console.log(`[${index}] end ${wait}`);
    if (Math.random() < 0.25) {
      console.log(`TRIGGERING ERROR [${index}]`);
      // error out with 25% chance to test retry
      throw new Error("random error");
    }
  }
}

// add 5 jobs
for (let i = 0; i < 5; i++) {
  pq.add(Factory(i));
}
