import { Errback } from "./types.ts";
import { ArangoError, HttpError } from "../error.ts";

const xhr = (
  { url, ...options }: any,
  cb: Errback<Response & { data?: any }>,
) => {
  const req = new Request(url, options);

  fetch(req)
    .then(async (response) => {
      if (!options?.expectBinary) {
        let body;
        body = await response.clone().json();
        if (body?.error) {
          return cb(new ArangoError({ ...response, body, request: req }));
        }

        return cb(null, response);
      } else {
        cb(new HttpError({ ...response, body: null, request: req }), {
          ...response,
          body: null,
        });
      }
    })
    .catch((error) => cb(error));

  return req;
};

export default xhr;
