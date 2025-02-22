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

	onFileClick(event, path) {
		event.stopPropagation();
		if (!event.ctrlKey) this.querySelectorAll('file.selected').forEach(c => c.classList.remove('selected'));
		event.currentTarget.classList.add('selected');

		// TODO show diff of 'path'
	}
	clearSelection() {
		this.querySelectorAll('file.selected').forEach(c => c.classList.remove('selected'));
	}

	#render() {
		this.innerHTML = `<mingit-toolbar></mingit-toolbar><change-list onclick="${this.handle}.clearSelection()"></change-list>`;
	}

	#renderChanges(status) {
		const name = (path) => path.split(/\\|\//).pop();

		this.querySelector('change-list').innerHTML =
			status.files.map(f => /*html*/`<file title="${f.path}" onclick="${this.handle}.onFileClick(event, '${f.path}')" tabindex="0">
				<span>${name(f.path)}</span><span class="secondary">${f.path}</span>
				${this.#renderDecorations(f)}
			</file>`).join('');
	}
	#renderDecorations(file) {
		if (file.insertions || file.deletions) return /*html*/`<decorations>
				${file.insertions ? `<span class="insertions">+${file.insertions}</span>` : ''}
				${file.deletions ? `<span class="deletions">-${file.deletions}</span>` : ''}
			</decorations>`;

		return `<decorations class="${file.working_dir.trim() || file.index}">${file.working_dir.trim() || file.index}</decorations>`;
	}
}

customElements.define('mingit-change-list', ChangesList);
