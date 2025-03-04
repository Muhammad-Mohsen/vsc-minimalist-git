import HTMLElementBase from "../../core/html-element-base.js";

class ChangesList extends HTMLElementBase {
	#toolbar;

	connectedCallback() {
		this.#render();
		this.#toolbar = this.querySelector('mingit-toolbar');
	}

	onMessage(event) {
		const message = event.data;
		if (message.command == 'state') this.#renderChanges(message.body.status);
		if (message.command == 'diff') {
			this.#renderChanges(message.body);
			this.#toolbar.toggle(false);
		}
		if (message.command == 'status') {
			this.#renderChanges(message.body);
			this.#toolbar.toggle(true);
		}
	}

	onFileClick(event, name, path, decorator, hashes) {
		event.stopPropagation();
		if (!event.ctrlKey) this.querySelectorAll('file.selected').forEach(c => c.classList.remove('selected'));
		event.currentTarget.classList.add('selected');

		// show diff of 'path'
		this.postMessage({ command: 'diffeditor', body: { name, path, decorator, hashes: hashes.split(',') } });
	}
	clearSelection() {
		this.querySelectorAll('file.selected').forEach(c => c.classList.remove('selected'));
	}

	#render() {
		this.innerHTML = `<mingit-toolbar></mingit-toolbar><change-list onclick="${this.handle}.clearSelection()"></change-list>`;
	}
	#renderChanges(status) {
		this.querySelector('change-list').innerHTML =
			status.files.map(f => /*html*/`<file title="${f.path}" onclick="${this.handle}.onFileClick(event, '${f.name}', '${f.path}', '${f.decorator}', '${status.hashes || ''}')" tabindex="0">
				<span>${f.name}</span><span class="secondary">${f.path}</span>
				${this.#renderDecorations(f)}
			</file>`).join('');
	}
	#renderDecorations(file) {
		if (file.decorator) return `<decorations class="${file.decorator.trim() || file.index}">${file.decorator.trim() || file.index}</decorations>`;
		else return /*html*/`<decorations>
			${file.insertions ? `<span class="insertions">+${file.insertions}</span>` : ''}
			${file.deletions ? `<span class="deletions">-${file.deletions}</span>` : ''}
		</decorations>`;
	}
}

customElements.define('mingit-change-list', ChangesList);
