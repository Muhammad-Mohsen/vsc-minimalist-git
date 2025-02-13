import HTMLElementBase from "../../core/html-element-base.js";
import { vsc } from "../../core/vsc.js";

class CommitList extends HTMLElementBase {

	connectedCallback() {
		window.addEventListener('message', (event) => this.#onMessage(event));
		vsc.postMessage({ command: 'load' });
	}

	/** @param {MessageEvent} event */
	#onMessage(event) {
		console.log(event.data);

		const message = event.data;
		if (message.command == 'logs') this.#render(message.body);
	}

	#render(logs) {
		this.innerHTML = '<connectors></connectors>' + logs.commitList.map(c => {
			const datetime = new Date(Number(c.date) * 1000);

			return /*html*/`<commit>
					${this.#renderVertices(c, logs.branchCount, logs.colors)}
					<div class="col">
						<div class="row">
							${this.#renderBranches(c)}
							${this.#renderTags(c)}
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

		this.#renderEdges();
	}

	#renderVertices(commit, count, colors) {
		return new Array(count).fill('')
			.map((b, i) => {
				if (i != commit.branchIndex) return '<cell></cell>';
				else return `<cell class="marker" style="--branch-color: ${colors[i]};" hash="${commit.hash}" parents="${commit.parents.toString()}"></cell>`;
			})
			.join('');
	}
	#renderEdges() {
		const connectorMap = {};
		this.querySelectorAll('cell').forEach(c => connectorMap[c.getAttribute('hash')] = c);

		const containerBounds = this.querySelector('connectors').getBoundingClientRect();

		let connectorHTML = '';
		Object.values(connectorMap).forEach(c => { // for each commit
			const parents = c.getAttribute('parents')?.split(',').filter(p => p); // remove empty parents
			parents?.forEach(hash => {
				const p = connectorMap[hash] || c; // if parent is unreachable (due to filtering/paging) set the parent to itself

				const bounds = c.getBoundingClientRect();
				const parentBounds = p.getBoundingClientRect();

				const bend = bounds.x - parentBounds.x;
				let qualifier = bend < 0 ? 'right'
					: bend > 0 ? 'left'
					: '';

				if (qualifier == 'left' && this.#hasCollisions(c, p)) qualifier = 'right flip';
				if (qualifier == '' && this.#hasCollisions(c, p)) qualifier = 'orphan';
				if (c == p) qualifier = 'orphan'; // parent is unreachable

				let color = qualifier.includes('right') ? p : c;
				color = color.getAttribute('style');

				connectorHTML += `<con style="top: ${bounds.y - containerBounds.y}px;
					left: ${Math.min(bounds.x, parentBounds.x)}px;
					width: ${Math.abs(bounds.x - parentBounds.x)}px;
					height: ${Math.abs(bounds.y - parentBounds.y)}px;
					${color}"
					class="${qualifier}"></con>`.replace(/\t|\n/g, '');
			});
		});

		this.querySelector('connectors').innerHTML = connectorHTML;
	}
	#hasCollisions(c, p) {
		const commit = c.parentElement;
		const parentCommit = p.parentElement;

		const list = [...commit.parentElement.children];
		const commitIndex = list.indexOf(commit);
		const parentCommitIndex = list.indexOf(parentCommit);
		const branchIndex = [...commit.children].indexOf(c);

		for (let hitTestCommit of list.slice(commitIndex + 1, parentCommitIndex)) {
			if (hitTestCommit.querySelector(`cell:nth-child(${branchIndex + 1})`).classList.contains('marker')) return true;
		}

		return false;
	}

	#renderBranches(commit) {
		if (!commit.refs.branches.length) return '';
		return `<i class="ic-branch" title="${commit.refs.branches.join('\n')}"></i>`;
	}
	#renderTags(commit) {
		if (!commit.refs.tags.length) return '';
		return `<i class="ic-tag" title="${commit.refs.tags.join('\n')}"></i>`;
	}
}

customElements.define('mingit-commit-list', CommitList);
