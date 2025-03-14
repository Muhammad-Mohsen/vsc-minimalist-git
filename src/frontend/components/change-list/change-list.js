import HTMLElementBase from "../../core/html-element-base.js";

class ChangesList extends HTMLElementBase {
	#toolbar;

	connectedCallback() {
		this.#render();
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

	onClick(event, name, path, decorator, hashes) {
		event.stopPropagation();
		if (!event.ctrlKey) this.querySelectorAll('li.selected').forEach(c => c.classList.remove('selected'));
		event.currentTarget.classList.toggle('selected');

		// show diff of 'path'
		this.postMessage({ command: 'diffeditor', body: { name, path, decorator, hashes: hashes.split(',') } });
	}
	clearSelected() {
		this.querySelectorAll('file.selected').forEach(c => c.classList.remove('selected'));
	}
	getSelected() {
		const selected = Array.from(this.querySelectorAll('li.selected')).map(f => f.title);
		if (selected.length) return selected;
		else return Array.from(this.querySelectorAll('li')).map(f => f.title); // if none selected, return all
	}

	#render() {
		this.innerHTML = /*html*/`
			<mingit-toolbar style="display: none;">
			</mingit-toolbar><ul onclick="${this.handle}.clearSelected()"></ul>`;

		this.#toolbar = this.querySelector('mingit-toolbar');
	}
	#renderChanges(status) {
		this.#toolbar.style.display = '';

		this.querySelector('ul').innerHTML =
			status.files.map(f => /*html*/`<li title="${f.path}" onclick="${this.handle}.onClick(event, '${f.name}', '${f.path}', '${f.decorator}', '${status.hashes || ''}')" tabindex="0">
				<span>${f.name}</span><span class="secondary">${f.path}</span>
				${this.#renderDecorations(f)}
			</li>`).join('');
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
