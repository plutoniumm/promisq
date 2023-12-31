type RetryMethod = (count: number) => number;
interface FnBox {
  fn: Function;
  memo: Function;
  retries: number;
}

class PromiseQueue {
  concurrency: number = 6;

  retries: number = 3;
  // default: jittered exponential backoff
  retryMethod: RetryMethod = (count) => ((count ** 2 * 1000) * (Math.random() + 1)) | 0;
  // postpone => add to the end of the queue
  // else immidiate retry
  retry_postpone: boolean = false;

  queue: any[];
  #now_running: number = 0;

  constructor(opts: any) {
    this.queue = [];

    const keys = ["concurrency", "retry", "retryMethod", "retry_postpone"];
    if (opts) {
      keys.forEach((key) => {
        if (keys.hasOwnProperty(key)) {
          // @ts-ignore
          this[key] = opts[key];
        }
      });
    }
  }

  add (promiseFn: Function | FnBox) {
    // @ts-ignore
    let box: FnBox = {};
    if (typeof promiseFn === "function") {
      box.fn = promiseFn;
      box.memo = promiseFn;
      box.retries = this.retries;
    } else {
      box = promiseFn;
    }

    // using ()=>{} and not function because then 'this' is bound to the function
    const job = async () => {
      this.#now_running++;
      try {
        if (!box.fn) box.fn = box.memo;
        await box.fn();
      } catch (e) {
        if (box.retries > 0) {
          box.retries--;
          if (this.retry_postpone) {
            this.queue.push(box);
          } else {
            const delay = this.retryMethod(this.retries - box.retries);
            setTimeout(job, delay);
          }
        }
        // quiet fail
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