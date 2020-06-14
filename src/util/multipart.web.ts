import { Fields, MultipartRequest } from "./multipart.ts";
import { Errback } from "./types.ts";

export function toForm(fields: Fields, callback: Errback<MultipartRequest>) {
  let form;
  try {
    form = new FormData();
    for (const key of Object.keys(fields)) {
      let value = fields[key];
      if (value === undefined) continue;
      if (
        !(value instanceof Blob) &&
        (typeof value === "object" || typeof value === "function")
      ) {
        value = JSON.stringify(value);
      }
      form.append(key, value);
    }
  } catch (e) {
    callback(e);
    return;
  }
  callback(null, { body: form });
}
