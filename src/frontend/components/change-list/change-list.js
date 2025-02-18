import HTMLElementBase from "../../core/html-element-base.js";

class ChangesList extends HTMLElementBase {

	connectedCallback() {
		this.#render();
		this.postMessage({ command: 'getstatus' });
	}

	onMessage(event) {
		const message = event.data;
		if (message.command == 'status') this.#renderChanges(message.body);
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
				<decorations>${f.working_dir}</decorations>
			</file>`).join('');
	}
}

customElements.define('mingit-change-list', ChangesList);
