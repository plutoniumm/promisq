import PQ from "./index.ts";

const pq = new PQ({
  concurrency: 2,
  retry: 2,
  retryMethod: (count: number) => (count ** 2 * 1000) * (Math.random() + 1),
  retry_postpone: false,
});

function Factory (index: number): () => Promise<void> {
  console.log(`[${index}] factory`);
  return async () => {
    const wait = Math.random() * 1000;
    console.log(`[${index}] start ${wait}`);
    await new Promise((resolve) => setTimeout(resolve, wait));
    console.log(`[${index}] end ${wait}`);
    if (Math.random() > 0.25) {
      // error out with 25% chance to test retry
      throw new Error("random error");
    }
  }
}

// add 5 jobs
for (let i = 0; i < 5; i++) {
  pq.add(Factory(i));
}
