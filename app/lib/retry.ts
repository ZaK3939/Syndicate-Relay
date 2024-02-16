import axios from 'axios';
import { AxiosResponse } from 'axios';

export type RetryableApiOptions = {
  delay?: number;
  times?: number;
};

const defaultRetryableApiOptions: RetryableApiOptions = {
  delay: 500,
  times: 1,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const retryfunc = async <T>(f: () => Promise<T>, retries: number): Promise<T> => {
  try {
    await sleep(1000 + Math.random() * 10000);
    return await f();
  } catch (err) {
    return retries > 0 ? retryfunc(f, retries - 1) : Promise.reject(err);
  }
};

export async function retryableApiPost<T>(
  endpoint: string,
  data: any,
  opts?: RetryableApiOptions,
): Promise<T> {
  if (opts) {
    opts = { ...defaultRetryableApiOptions, ...opts } as RetryableApiOptions;
  } else {
    opts = defaultRetryableApiOptions;
  }
  if (!opts.delay || !opts.times) {
    throw 'invalid opts';
  }
  let result: T | undefined;
  for (let i = 0; i < opts.times + 1; ++i) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': `${process.env.PHI_API_KEY}`,
      };
      const resp: AxiosResponse<T, any> = await axios.post<T>(endpoint, data, { headers: headers });
      if (resp.status == 200) {
        result = resp.data;
        break;
      } else {
        console.error(
          `axios.post ${endpoint} with data ${JSON.stringify(data)} returns code ${resp.status} and data ${
            resp.data
          }. retry count ${i}`,
        );
      }
    } catch (e) {
      console.error(
        `axios.post ${endpoint} with data ${JSON.stringify(data)} throws an error. retry count ${i}.`,
        e,
      );
    }

    await sleep(opts.delay);
  }
  if (!result) {
    console.error({ data: data });
    throw `axios.post error no result`;
  }
  return result;
}

export async function retryableAsyncRequest(func: any, opts?: RetryableApiOptions): Promise<any> {
  if (opts) {
    opts = { ...defaultRetryableApiOptions, ...opts } as RetryableApiOptions;
  } else {
    opts = defaultRetryableApiOptions;
  }
  if (!opts.delay || !opts.times) {
    throw 'invalid opts';
  }
  let result, lastErr;
  for (let i = 0; i < opts.times + 1; ++i) {
    try {
      result = await func();
    } catch (e) {
      lastErr = e;
      if (i < opts.times) {
        console.log('retrying', i + 1);
      }
    }

    await sleep(opts.delay);
  }
  if (!result) {
    throw lastErr;
  }
  return result;
}
