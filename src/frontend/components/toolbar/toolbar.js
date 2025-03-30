import HTMLElementBase from "../../core/html-element-base.js";

class Toolbar extends HTMLElementBase {
	#progress;

	#commitInput;
	#commitButton;
	#overflowButton;
	#changeList;

	connectedCallback() {
		this.#render();
	}

	fetch() {
		this.toggleProgess(true);
		this.postMessage({ command: 'fetch' });
	}

	stash() {
		const files = this.#changeList.getSelected();
		const message = this.#commitInput.value.trim();

		this.toggleProgess(true);
		this.#commitInput.value = '';
		this.onCommitMessageChange();
		this.postMessage({ command: 'stash', body: { message, files } });
	}

	unstage() {
		const files = this.#changeList.getSelected();
		this.postMessage({ command: 'unstage', body: { files } });
	}
	stage() {
		const files = this.#changeList.getSelected();
		this.postMessage({ command: 'stage', body: { files } });
	}
	commit() {
		const files = this.#changeList.getSelected();
		const message = this.#commitInput.value.trim();

		this.toggleProgess(true);
		this.#commitInput.value = '';
		this.onCommitMessageChange();
		this.postMessage({ command: 'commit', body: { message, files } });
	}
	discard() {
		const files = this.#changeList.getSelected();
		this.postMessage({ command: 'discard', body: { files } });
	}

	overflow(event) {
		event.preventDefault();
		event.stopPropagation();
		event.currentTarget.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: event.clientX, clientY: event.clientY }));
	}

	toggle(force) {
		this.querySelectorAll('.toggleable').forEach(t => t.toggleAttribute('disabled', force != true));
		if (force) this.#commitInput.dispatchEvent(new Event('input'));
	}
	toggleProgess(force) {
		this.#progress.style.display = force ? '' : 'none';
	}

	onCommitMessageChange() {
		this.#commitButton.toggleAttribute('disabled', !this.#commitInput.value)
	}

	onMessage(event) {
		const message = event.data;
		if (message.command == 'commitmessage') return this.#commitInput.value = message.body.message;
		if (!['state', 'status'].includes(message.command)) return;

		this.toggleProgess();

		let repoState = (message.body.status || message.body).repoState || '';
		if (repoState.includes('cherry-picking')) repoState = `, "isCherryPicking": true`;
		else if (repoState.includes('rebase')) repoState = `, "isRebasing": true`;
		else if (repoState.includes('merge')) repoState = `, "isMerging": true`;
		else if (repoState.includes('revert')) repoState = `, "isReverting": true`;

		this.#overflowButton.dataset.vscodeContext = `{ "isOverflow": true ${repoState} }`;
	}

	#render() {
		this.innerHTML = `
			<div class="progress absolute" style="display: none;"></div>
			<button class="tertiary ic-fetch" onclick="${this.handle}.fetch();" title="Fetch"></button>
			<button class="tertiary ic-pull" onclick="${this.handle}.postMessage({ command: 'pull' })" title="Pull"></button>
			<button class="tertiary ic-push" onclick="${this.handle}.postMessage({ command: 'push' })" title="Push"></button>
			<separator></separator>
			<button class="tertiary ic-discard toggleable" onclick="${this.handle}.discard();" title="Discard"></button>
			<button class="tertiary ic-stash toggleable" onclick="${this.handle}.stash();" title="Stash"></button>
			<separator></separator>
			<button class="tertiary ic-unstage toggleable" onclick="${this.handle}.unstage();" title="Unstage"></button>
			<button class="tertiary ic-stage toggleable" onclick="${this.handle}.stage();" title="Stage"></button>
			<separator></separator>
			<button class="tertiary ic-overflow" onclick="${this.handle}.overflow(event);"></button>
			<div class="commit-row">
				<input placeholder="Message" class="toggleable" required oninput="${this.handle}.onCommitMessageChange();">
				<button class="tertiary ic-commit toggleable" title="Commit" disabled onclick="${this.handle}.commit();"></button>
			</div>
		`;

		this.#progress = this.querySelector('.progress');

		this.#commitInput = this.querySelector('.commit-row input');
		this.#commitButton = this.querySelector('.commit-row button');
		this.#overflowButton = this.querySelector('.ic-overflow');
		this.#changeList = document.querySelector('mingit-change-list');
	}
}

customElements.define('mingit-toolbar', Toolbar);
