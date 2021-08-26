# lcdb-client
Client api for lcdb.
```javascript
const lcdbClient = require("lcdb-client");
const api = lcdbClient({
  host: "ws://localhost:8080",
  auth: "secret",
  wsOptions: {},
  maxWait: 5000,
  reconnectTimeout: 500
});
const db = api("db");
(async() => {
  await db.set("key", "value");
  await db.get("key").then(res => console.log(res));
  await db.delete("key");
})();
```