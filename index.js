const nodeFetch = require("node-Fetch"),
  handler = (module.exports = function api({
  url, Authorization, limit = 15, speed = 1000, count = 0
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
              if (count > limit) return null;
              count++;
              return new Promise(res => {
                setTimeout(() => {
                  res(
                    handler({ url, Authorization, limit, speed, count })(db, options)[method](ref, value)
                  );
                }, speed);
              });
            });
        };
      }
    });
  };
});