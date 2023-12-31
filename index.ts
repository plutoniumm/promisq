type RetryMethod = (count: number) => number;

class PromiseQueue {
  timeout: number = 5000;
  concurrency: number = 6;

  retries: number = 3;
  // default: jittered exponential backoff
  retryMethod: RetryMethod = (count) => (count ** 2 * 1000) * (Math.random() + 1);
  // postpone => add to the end of the queue
  // else immidiate retry
  retry_postpone: boolean = false;

  queue: any[];
  #now_running: number = 0;

  constructor(opts: any) {
    this.queue = [];

    const keys = ["timeout", "concurrency", "retry", "retryMethod", "retry_postpone"];
    if (opts) {
      keys.forEach((key) => {
        if (keys.hasOwnProperty(key)) {
          this[key] = opts[key];
        }
      });
    }
  }

  // enqueue a promise
  add (promise: Promise<any>) {
    // using ()=>{} and not function because then 'this' is bound to the function
    const job = async () => {
      this.#now_running++;
      try {
        await promise;
      } catch (e) {
        // if (this.retry > 0) {
        //   this.retry--;
        //   if (this.retry_postpone) {
        //     this.queue.push(job);
        //   } else {
        //     this.add(promise);
        //   }
        // }
        console.log(e);
      } finally {
        this.#now_running--;
        this.next();
      }
    }

    if (this.#now_running < this.concurrency) {
      job();
    } else {
      this.queue.push(job);
    }
  }

  // start the next job
  next () {
    if (this.queue.length <= 0 || this.#now_running >= this.concurrency) {
      return;
    }

    const job = this.queue.shift();
    job();
  }
}


export default PromiseQueue;