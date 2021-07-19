const nodeFetch = require("node-Fetch"),
  handler = (module.exports = function api({
  url, Authorization, retriesLimit = 15, retriesTimeout = 1000, retries = 0
  }) {
  return function opt(db, options) {
    return new Proxy(function method() {}, {
      get(_, method) {
        return function args(ref, value) {
          return nodeFetch(url, {
              method: 'POST',
              body: JSON.stringify({
                db,
                options,
                method,
                ref,
                value
              }),
              headers: {
                Authorization
              }
            })
            .then(res => res.json())
            .then(({ data }) => data)
            .catch(() => {
              if (retries > retriesLimit) return null;
              retries++;
              return new Promise(res => {
                setTimeout(() => {
                  res(
                    handler({ url, Authorization, retriesLimit, retriesTimeout, retries })(db, options)[method](ref, value)
                  );
                }, retriesTimeout);
              });
            });
        };
      }
    });
  };
});