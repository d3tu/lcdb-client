const WS = require('ws');
module.exports = ({ host, auth, wsOptions, maxWait = 5000 } = {}) => {
	let idNum = 0,
		queue = [],
		promises = {},
		connected,
		ws;
	connect();
	function connect() {
		connected = false;
		ws = new WS(host, wsOptions);
		ws.onopen = () => {
			if (!connected)
				_send(
					JSON.stringify({
						op: 'login',
						auth,
						requests: queue
					})
				);
			queue.splice(0, queue.length);
		};
		ws.onmessage = message => {
			if (message.data === 'CONNECTED') {
				connected = true;
				return;
			}
			let { id, data } = JSON.parse(message.data),
				promise = promises[id];
			if (promise) {
				clearTimeout(promise.timeout);
				promise.resolve(data);
				delete promise[id];
			}
		};
		ws.onclose = connect;
		ws.onerror = connect;
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
				delete promises[id];
			}, maxWait);
		promises[id] = {
			resolve,
			timeout
		};
		_send(
			JSON.stringify(
				Object.assign(
					{
						id
					},
					data
				)
			)
		);
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
