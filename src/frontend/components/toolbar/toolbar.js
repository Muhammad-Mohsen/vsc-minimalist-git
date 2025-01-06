import HTMLElementBase from "../../core/html-element-base.js";
import { vsc } from "../../core/vsc.js";

class Toolbar extends HTMLElementBase {
	connectedCallback() {
		this._render();
	}

	fetch() {
		vsc.postMessage({ command: 'fetch' });
	}
	pull() {
		vsc.postMessage({ command: 'pull' });
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
		this.innerHTML = `<header>
			<button class="tertiary ic-fetch" onclick="${this.handle}.fetch();" title="Fetch"></button>
			<button class="tertiary ic-pull" onclick="${this.handle}.pull();" title="Pull"></button>
			<button class="tertiary ic-push" onclick="${this.handle}.push();" title="Push"></button>
			<separator></separator>
			<button class="tertiary ic-stash" onclick="${this.handle}.stash();" title="Stash"></button>
			<separator></separator>
			<button class="tertiary ic-unstage" onclick="${this.handle}.unstage();" title="Unstage"></button>
			<button class="tertiary ic-stage" onclick="${this.handle}.stage();" title="Stage"></button>
			<separator></separator>
			<button class="tertiary ic-commit" onclick="${this.handle}.commit();" title="Commit"></button>

			<!-- <separator></separator>
			<button class="tertiary ic-overflow" onclick="${this.handle}.overflow();"></button> --> <!-- ?? -->
		</header>`;
	}
}

customElements.define('mingit-toolbar', Toolbar);
