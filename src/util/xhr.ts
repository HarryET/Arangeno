import { Errback } from "./types.ts";

const xhr = (
  { url, ...options }: any,
  cb: Errback<Response & { data?: any }>,
) => {
  const req = new Request(url, options);

  fetch(req)
    .catch((err) => err)
    .then(async (res) => {
      if (res instanceof Error) {
        throw res;
      } else {
        const clone = res.clone() as Response;
        const data = await clone.json();

        if (data?.error) {
          data.request = req;
          cb(data);
        } else {
          res.data = data;
          cb(null, res);
        }
      }
    });

  return req;
};

export default xhr;
