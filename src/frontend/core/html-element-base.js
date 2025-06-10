// @ts-ignore
const vsc = window.vsc || acquireVsCodeApi();
// @ts-ignore
window.vsc = vsc;

export default class HTMLElementBase extends HTMLElement {
	handle;

	constructor() {
		super();

		this.handle = `${this.constructor.name}_${Date.now()}`;
		window[this.handle] = this;

		window.addEventListener('message', (event) => this.onMessage(event));
	}

	postMessage(msg) {
		vsc.postMessage(msg);
	}
	onMessage(event) {
		console.log(event);
	}

	setState(state) {
		vsc.setState(state);
	}
	getState() {
		return vsc.getState();
	}

	encodeHTML(str) {
		const map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;'
		};
		return str.replace(/[&<>"]/g, (m) => map[m]);
	}
}
