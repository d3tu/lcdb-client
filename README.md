# lcdb-client
Client api for lcdb.
```javascript
const lcdbClient = require("lcdb-client");
const api = lcdbClient({
  url: "http://localhost:8080",
  Authorization: "secret",
  retriesLimit: 15,
  retriesTimeout: 1000
});
const db = api("db");
(async() => {
  await db.set("key", "value");
  await db.get("key").then(res => console.log(res));
  await db.delete("key");
})();
```