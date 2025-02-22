import HTMLElementBase from "../../core/html-element-base.js";

class Toolbar extends HTMLElementBase {
	#commitInput;
	#commitButton;

	connectedCallback() {
		this.#render();
		this.#commitInput = this.querySelector('.commit-row input');
		this.#commitButton = this.querySelector('.commit-row button');
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

	toggle(force) {
		this.querySelectorAll('.toggleable').forEach(t => t.toggleAttribute('disabled', force != true));
		if (force) this.#commitInput.dispatchEvent(new Event('input'));
	}

	onCommitMessageChange(input) {
		this.#commitButton.toggleAttribute('disabled', !input.value)
	}

	#render() {
		this.innerHTML = /*html*/`
			<div class="commit-row">
				<input placeholder="Message" class="toggleable" required oninput="${this.handle}.onCommitMessageChange(this);">
				<button class="tertiary ic-commit toggleable" title="Commit" disabled onclick="${this.handle}.commit();"></button>
			</div>
			<button class="tertiary ic-fetch" onclick="${this.handle}.postMessage({ command: 'fetch' });" title="Fetch"></button>
			<button class="tertiary ic-pull" onclick="${this.handle}.postMessage({ command: 'pull' })" title="Pull"></button>
			<button class="tertiary ic-push" onclick="${this.handle}.push();" title="Push"></button>
			<separator></separator>
			<button class="tertiary ic-stash toggleable" onclick="${this.handle}.stash();" title="Stash"></button>
			<separator></separator>
			<button class="tertiary ic-unstage toggleable" onclick="${this.handle}.unstage();" title="Unstage"></button>
			<button class="tertiary ic-stage toggleable" onclick="${this.handle}.stage();" title="Stage"></button>
			<separator></separator>
			<button class="tertiary ic-overflow" onclick="${this.handle}.overflow();"></button>
		`;
	}
}

customElements.define('mingit-toolbar', Toolbar);
