import { joinPath } from "./joinPath.ts";
import { Errback } from "./types.ts";
import xhr from "./xhr.ts";

export type ArangojsResponse = Response & {
  request: Request;
  body?: any;
  arangojsHostId?: number;
  data?: any;
};

export type ArangojsError = Error & {
  request: Request;
};

export interface RequestOptions {
  method: string;
  url: { pathname: string; search?: string };
  headers: { [key: string]: string };
  body: any;
  expectBinary: boolean;
  timeout?: number;
}

export const isBrowser = true;

function omit<T>(obj: T, keys: (keyof T)[]): T {
  const result = {} as T;
  for (const key of Object.keys(obj)) {
    if (keys.includes(key as keyof T)) continue;
    result[key as keyof T] = obj[key as keyof T];
  }
  return result;
}

export function createRequest(
  baseUrl: string,
  agentOptions: any,
  ...args: any[]
): any;
export function createRequest(baseUrl: string, agentOptions: any) {
  const $url = new URL(baseUrl);
  const { username = "root", password = "", ..._bup } = $url;

  $url.username = "";
  $url.password = "";

  const options = omit(agentOptions, [
    "keepAlive",
    "keepAliveMsecs",
    "maxSockets",
  ]);
  return function request(
    { method, url, headers, body, timeout, expectBinary }: RequestOptions,
    cb: Errback<ArangojsResponse>,
  ) {
    $url.pathname = url.pathname;

    // TODO: fix path joining

    // $url.pathname = url.pathname
    //   ? $url.pathname
    //     ? joinPath($url.pathname, url.pathname)
    //     : url.pathname
    //   : $url.pathname;
    $url.search = url.search
      ? $url.search ? `${$url.search}&${url.search.slice(1)}` : url.search
      : $url.search;

    if (!headers["authorization"]) {
      const basic = btoa(`${username}:${password}`);
      headers["authorization"] = `Basic ${basic}`;
    }

    let callback: Errback<ArangojsResponse> = (err, res) => {
      callback = () => undefined;
      cb(err, res);
    };

    const payload: RequestInit = {
      responseType: expectBinary ? "blob" : "text",
      ...options,
      url: $url.href,
      withCredentials: true,
      credentials: "include",
      useXDR: true,
      mode: "cors",
      body,
      method,
      headers,
      timeout,
    };

    const req = xhr(payload, async (err: Error | null, res?: any) => {
      if (!err) {
        if (!res.body) res.body = "";
        callback(null, res as ArangojsResponse);
      } else {
        const error = err as ArangojsError;
        error.request = req;
        callback(error);
      }
    });
  };
}
