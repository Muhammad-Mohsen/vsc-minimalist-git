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

	_render(logs) {
		this.innerHTML = '<connectors></connectors>' + logs.commitList.map(c => {
			const datetime = new Date(Number(c.date) * 1000);

			return /*html*/`<commit>
					${this._markers(c, logs.branchCount, logs.colors)}
					<div class="col">
						<div class="row">
							${this._branches(c)}
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

		this._connectors();
	}

	_markers(commit, count, colors) {
		return new Array(count).fill('')
			.map((b, i) => {
				if (i != commit.branchIndex) return '<cell></cell>';
				else return `<cell class="marker" style="--branch-color: ${colors[i]};" hash="${commit.hash}" parents="${commit.parents.toString()}"></cell>`;
			})
			.join('');
	}
	_connectors() {
		const connectorMap = {};
		this.querySelectorAll('cell').forEach(c => connectorMap[c.getAttribute('hash')] = c);

		let connectorHTML = '';
		Object.values(connectorMap).forEach(c => {
			c.getAttribute('parents')?.split(',')?.forEach(hash => {
				const p = connectorMap[hash];

				if (!p) return; // assume that all parents are reachable

				const bounds = c.getBoundingClientRect();
				const parentBounds = p.getBoundingClientRect();

				const bend = bounds.x - parentBounds.x;
				const bendClass = bend < 0 ? 'right'
					: bend > 0 ? 'left'
					: '';

				let color = bendClass == 'right' ? p : c;
				color = color.getAttribute('style');

				connectorHTML += `<con style="top: ${bounds.y + 4}px;
					left: ${Math.min(bounds.x, parentBounds.x) + 4}px;
					width: ${Math.abs(bounds.x - parentBounds.x)}px;
					height: ${Math.abs(bounds.y - parentBounds.y)}px;
					${color}"
					class="${bendClass}"></con>`.replace(/\t|\n/g, '');
			});
		});

		this.querySelector('connectors').innerHTML = connectorHTML;
	}
	_branches(commit) {
		if (!commit.refs.branches.length) return '';
		return `<i class="ic-branch" title="${commit.refs.branches.join('\n')}"></i>`;
	}
	_tags(commit) {
		if (!commit.refs.tags.length) return '';
		return `<i class="ic-tag" title="${commit.refs.tags.join('\n')}"></i>`;
	}
}

customElements.define('mingit-commit-list', CommitList);
