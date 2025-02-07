import HTMLElementBase from "../../core/html-element-base.js";

class Toolbar extends HTMLElementBase {
	connectedCallback() {
		this._render();
	}

	push() {

	}

	stash() {

	}

	unstage() {

	}
	stage() {

	}
	commit() {

	}

	getSelected() {

	}

	_render() {
		this.innerHTML = /*html*/`
			<button class="tertiary ic-fetch" onclick="vsc.postMessage({ command: 'fetch' });" title="Fetch"></button>
			<button class="tertiary ic-pull" onclick="vsc.postMessage({ command: 'pull' })" title="Pull"></button>
			<button class="tertiary ic-push" onclick="${this.handle}.push();" title="Push"></button>
			<separator></separator>
			<button class="tertiary ic-stash" onclick="${this.handle}.stash();" title="Stash"></button>
			<separator></separator>
			<button class="tertiary ic-unstage" onclick="${this.handle}.unstage();" title="Unstage"></button>
			<button class="tertiary ic-stage" onclick="${this.handle}.stage();" title="Stage"></button>
			<separator></separator>
			<button class="tertiary ic-commit" onclick="${this.handle}.commit();" title="Commit"></button>

			<!-- <separator></separator> --> <!-- ?? -->
			<button class="tertiary ic-overflow" onclick="${this.handle}.overflow();"></button>
		`;
	}
}

customElements.define('mingit-toolbar', Toolbar);
