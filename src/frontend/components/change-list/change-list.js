import HTMLElementBase from "../../core/html-element-base.js";

class ChangesList extends HTMLElementBase {
	#changeList;
	#shiftSelected;

	connectedCallback() {
		this.#render();
	}

	onMessage(event) {
		const message = event.data;

		if (message.command == 'hideprogress') return;

		if (message.command == 'state') this.#renderChanges(message.body.status);
		else this.#renderChanges(message.body);

		this.#shiftSelected = null; // clear the selection on update
	}

	onClick(event, name, path, decorator, hashes) {
		event.stopPropagation();
		if (event.shiftKey && this.#shiftSelected != null) {
			this.querySelectorAll('li.selected').forEach(c => c.classList.remove('selected')); // clear
			const currentSelected = this.#index(event.currentTarget);

			for (let i = Math.min(currentSelected, this.#shiftSelected); i <= Math.max(currentSelected, this.#shiftSelected); i++) {
				this.#changeList.children[i].classList.add('selected');
			}

		} else {
			if (!event.ctrlKey) this.querySelectorAll('li.selected').forEach(c => c.classList.remove('selected')); // clear
			event.currentTarget.classList.toggle('selected');
			this.#shiftSelected = this.#index(event.currentTarget);
		}

		// show diff of 'path'
		this.postMessage({ command: 'diffeditor', body: { name, path, decorator, hashes: hashes.split(',') } });

		// increases perceived performance!! because the currentTarget is blurred automatically after the diff editor opens...making it look laggy
		event.currentTarget.blur();
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
		this.innerHTML = `
			<mingit-toolbar>
			</mingit-toolbar><ul onclick="${this.handle}.clearSelected()"></ul>`;

		this.#changeList = this.querySelector('ul');
	}
	#renderChanges(status) {
		this.style.display = '';

		this.#changeList.innerHTML =
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

	#index(change) {
		return Array.from(this.#changeList.children).indexOf(change);
	}
}

customElements.define('mingit-change-list', ChangesList);
