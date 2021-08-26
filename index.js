const WS = require('ws');

module.exports = ({ 
  reconnectTimeout = 500,
  maxWait = 5000,
  wsOptions, host, auth
} = {}) => {
  var idNum = 0,
    ws = null,
    cache = [],
    promises = new Map(),
    connected = false,
    connect = () => {
      ws = new WS();
      
      ws.onopen = () => {
        if (!connected) _send(JSON.stringify({
          op: 'login',
          requests: queue.splice(0, queue.length),
          auth
        }));
      };
      
      ws.onmessage = message => {
        if (message.data === 'CONNECTED') {
          connected = true;
          return;
        }
        
        const { id, data } = JSON.parse(message.data),
          promise = promises.get(id);
          
        if (!promise) return;
        
        clearTimeout(promise.timeout);
        
        promise.resolve(data);
        
        promises.delete(id);
      };
      
      ws.onerror = reconnect;
      
      ws.onclose = reconnect;
    };
  
  connect();
  
  function reconnect() {
    ws = null;
    
    connected = false;
    
    setTimeout(connect, reconnectTimeout);
  }
  
  function send(data) {
    let id = idNum++,
      resolve,
      reject,
      promise = new Promise((res, rej) => {
        resolve = res;
        
        reject = rej;
      }),
      timeout = setTimeout(() => {
        reject('Time expired.');
        
        promises.delete(id);
      }, maxWait);
      
    promises.set(id, { resolve, timeout });
    
    _send(JSON.stringify(Object.assign({}, { id }, data)));
    
    return promise;
  }
  
  function _send(data) {
    if (ws && ws.readyState === WS.OPEN) ws.send(data);
    else queue.push(data);
  }
  
  return function db(d, o) {
    return new Proxy(function method() {}, {
      get(t, m) {
        return function args(r, v) {
          return send({
            db: d,
            options: o,
            method: m,
            ref: r,
            value: v
          });
        };
      }
    });
  };
};