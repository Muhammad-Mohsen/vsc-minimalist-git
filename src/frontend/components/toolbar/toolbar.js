import HTMLElementBase from "../../core/html-element-base.js";

class Toolbar extends HTMLElementBase {
	#progress;

	#commitTextarea;
	#commitButton;
	#overflowButton;
	#changeList;
	#commitList;

	#repoState;

	connectedCallback() {
		this.#render();
	}

	fetch() {
		this.toggleProgress(true);
		this.postMessage({ command: 'fetch' });
	}

	stash() {
		const files = this.#changeList.getSelected();
		const message = this.#commitTextarea.value.trim();

		this.toggleProgress(true);
		this.#commitTextarea.value = '';
		this.onCommitMessageChange();
		this.postMessage({ command: 'stash', body: { message, files } });
	}

	unstage() {
		const files = this.#changeList.getSelected();
		this.postMessage({ command: 'unstage', body: { files } });
	}
	stage() {
		this.toggleProgress(true);
		const files = this.#changeList.getSelected();
		this.postMessage({ command: 'stage', body: { files } });
	}
	commit() {
		const files = this.#changeList.getSelected();
		const message = this.#commitTextarea.value.trim();

		this.toggleProgress(true);
		this.#commitTextarea.value = '';
		this.onCommitMessageChange();
		this.postMessage({ command: 'commit', body: { message, files } });
	}
	discard() {
		const files = this.#changeList.getSelected('forDiscard');
		this.postMessage({ command: 'discard', body: { ...files } });
	}

	overflow(event) {
		event.preventDefault();
		event.stopPropagation();
		const files = this.#changeList.getSelected().join(';');
		this.#overflowButton.dataset.vscodeContext = `{ "isOverflow": true ${this.#repoState}, "files":"${files}" }`;
		event.currentTarget.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: event.clientX, clientY: event.clientY }));
	}

	#toggle(force) {
		this.querySelectorAll('.toggleable').forEach(t => t.toggleAttribute('disabled', force != true));
		if (force) this.#commitTextarea.dispatchEvent(new Event('input'));
	}
	toggleProgress(force) {
		this.#progress.style.display = force ? '' : 'none';
	}

	onCommitMessageChange() {
		this.#commitButton.toggleAttribute('disabled', !this.#commitTextarea.value);
	}
	onCommitMessageKeyDown(event) { // handle 'Enter' key
		if (event.key == 'Enter' && !event.shiftKey && this.#commitTextarea.value) {
			event.preventDefault();
			return this.commit();
		}
	}

	onMessage(event) {
		const message = event.data;

		this.toggleProgress();
		const isWorkingTree = this.#commitList.getSelected();
		this.#toggle(isWorkingTree.length == 1 && isWorkingTree[0] == ''); // enable the toolbar if on working tree
		if (message.command == 'commitmessage') return this.#commitTextarea.value = message.body.message;

		if (!['state', 'status'].includes(message.command)) return;

		this.#repoState = (message.body.status || message.body).repoState || '';
		if (this.#repoState.includes('cherry-picking')) this.#repoState = `, "isCherryPicking": true`;
		else if (this.#repoState.includes('rebase')) this.#repoState = `, "isRebasing": true`;
		else if (this.#repoState.includes('merge')) this.#repoState = `, "isMerging": true`;
		else if (this.#repoState.includes('revert')) this.#repoState = `, "isReverting": true`;
	}

	#render() {
		this.innerHTML = `
			<button class="tertiary ic-fetch" onclick="${this.handle}.fetch()" title="Fetch"></button>
			<button class="tertiary ic-pull" onclick="${this.handle}.toggleProgress(true);${this.handle}.postMessage({ command: 'pull' })" title="Pull"></button>
			<button class="tertiary ic-push" onclick="${this.handle}.toggleProgress(true);${this.handle}.postMessage({ command: 'push' })" title="Push"></button>
			<separator></separator>
			<button class="tertiary ic-discard toggleable" onclick="${this.handle}.discard()" title="Discard"></button>
			<button class="tertiary ic-stash toggleable" onclick="${this.handle}.stash()" title="Stash"></button>
			<separator></separator>
			<button class="tertiary ic-unstage toggleable" onclick="${this.handle}.unstage()" title="Unstage"></button>
			<button class="tertiary ic-stage toggleable" onclick="${this.handle}.stage()" title="Stage"></button>
			<separator></separator>
			<button class="tertiary ic-overflow" onclick="${this.handle}.overflow(event)"></button>
			<div class="commit-row">
				<textarea placeholder="Message" class="toggleable" required oninput="${this.handle}.onCommitMessageChange()" onkeydown="${this.handle}.onCommitMessageKeyDown(event)"></textarea>
				<button class="tertiary ic-commit toggleable" title="Commit" disabled onclick="${this.handle}.commit()"></button>
			</div>
		`;

		this.#progress = document.querySelector('.progress');

		this.#commitTextarea = this.querySelector('.commit-row textarea');
		this.#commitButton = this.querySelector('.commit-row button');
		this.#overflowButton = this.querySelector('.ic-overflow');
		this.#changeList = document.querySelector('mingit-change-list');
		this.#commitList = document.querySelector('mingit-commit-list');
	}
}

customElements.define('mingit-toolbar', Toolbar);
