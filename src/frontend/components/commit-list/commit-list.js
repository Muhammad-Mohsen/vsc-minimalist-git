import HTMLElementBase from "../../core/html-element-base.js";
import { vsc } from "../../core/vsc.js";

class CommitList extends HTMLElementBase {

	connectedCallback() {
		window.addEventListener('message', (event) => this._onMessage(event));
		vsc.postMessage({ command: 'load' });
	}

	/** @param {MessageEvent} event */
	_onMessage(event) {
		console.log(event.data);

		const message = event.data;
		if (message.command == 'logs') this._render(message.body);
	}

	// TODO move the type defs to a separate file
	// /** @param {Array<{ branchIndex: number, hash: string, refs: { branches: Array<string>, tags: Array<string> }, parents: Array<string>, name: string, email: string, date: number, committerDate: number, body: string }>} logs */
	_render(logs) {
		this.innerHTML = logs.commitList.map(c => {
			const datetime = new Date(Number(c.date) * 1000);

			return /*html*/`<commit style="--branch-color: ${logs.colors[c.branchIndex]}">
					${this._graph(c, logs.branchCount)}
					<div class="col">
						<div class="row">
							${this._origin(c)}
							${this._tags(c)}
							<p class="commit-body" title="${c.body}">${c.body}</p>
						</div>
						<div class="row secondary">
							<time datetime="${c.date}" title="${datetime.toLocaleString()}">${datetime.toLocaleDateString()}</time>
							&bull;
							<address class="author">${c.name}</address>
						</div>
					</div>
				</commit>`
		}).join('');
	}

	_graph(commit, count) {
		return new Array(count).fill('')
			.map((b, i) => `<cell ${i == commit.branchIndex ? `class="marker"` : ''}></cell>`)
			.join('');
	}
	_origin(commit) {
		if (!commit.refs.branches.length) return '';
		return `<i class="ic-branch" title="${commit.refs.branches.join('\n')}"></i>`;
	}

	_tags(commit) {
		if (!commit.refs.tags.length) return '';
		return `<i class="ic-tag" title="${commit.refs.tags.join('\n')}"></i>`;
	}
}

customElements.define('mingit-commit-list', CommitList);
