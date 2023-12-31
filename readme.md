## promq
Promise queue with concurrency control.

```sh
pnpm i promq
```

### Usage
All options are optional

| Option | Default | Description |
| --- | --- | --- |
| concurrency | 6 | Number of concurrent jobs |
| retry | 3 | Number of retries |
| retryMethod | Jittered exponential backoff (in s) | Retry timing function |
| retry_postpone | false | Postpone retry until all jobs are done |

```js
// returns async function/ promise
function Factory (index) {
  return async () => {
    const wait = Math.random() * 1000 | 0;
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
}

import PQ from 'promq';
const pq = new PQ({
  concurrency: 2,
  retry: 3,
  retryMethod: (count) => (count ** 2 * 1000) * (Math.random() + 1),
  retry_postpone: false,
});

// generally any async function can be added
for (let i = 0; i < 5; i++) {
  pq.add(Factory(i));
}
// runs 2 at a time
```