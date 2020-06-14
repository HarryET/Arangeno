import { default as stream } from "https://cdn.pika.dev/stream";
import { Buffer } from "https://deno.land/std/node/buffer.ts";
import _Multipart from "https://dev.jspm.io/npm:multi-part@3.0.0";

const { Readable } = stream as any;

declare class MultiPart {
  append(key: string, value: typeof Readable | Buffer | string): void;
  getBoundary(): string;
  getStream(): typeof Readable;
}

const Multipart = _Multipart as typeof MultiPart;

export type Fields = {
  [key: string]: any;
};

export type MultipartRequest = {
  headers?: { [key: string]: string };
  body: ArrayBuffer | FormData;
};

export function toForm(fields: Fields): Promise<MultipartRequest> {
  return new Promise((resolve, reject) => {
    try {
      const form = new Multipart();
      for (const key of Object.keys(fields)) {
        let value = fields[key];
        if (value === undefined) continue;
        if (
          !(value instanceof Readable) &&
          !(value instanceof Buffer) &&
          (typeof value === "object" || typeof value === "function")
        ) {
          value = JSON.stringify(value);
        }
        form.append(key, value);
      }
      const stream = form.getStream();
      const bufs: Buffer[] = [];
      stream.on("data", (buf: any) => bufs.push(buf as Buffer));
      stream.on("end", () => {
        bufs.push(Buffer.from("\r\n"));
        const body = Buffer.concat(bufs);
        const boundary = form.getBoundary();
        const headers = {
          "content-type": `multipart/form-data; boundary=${boundary}`,
          "content-length": String(body.length),
        };
        resolve({ body, headers });
      });
      stream.on("error", (e: any) => {
        reject(e);
      });
    } catch (e) {
      reject(e);
    }
  });
}
