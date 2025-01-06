export default class HTMLElementBase extends HTMLElement {
	handle;

	constructor() {
		super();
		this.handle = `${this.constructor.name}_${Date.now()}`;
		window[this.handle] = this;
	}
}
