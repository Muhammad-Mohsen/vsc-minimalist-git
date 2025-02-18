import HTMLElementBase from "../../core/html-element-base.js";

class CommitList extends HTMLElementBase {

	connectedCallback() {
		this.#render();
		this.postMessage({ command: 'getlog' });
	}

	onMessage(event) {
		const message = event.data;
		if (message.command == 'log') this.#renderCommits(message.body);
	}

	onCommitClick(event, hash) {
		if (!event.ctrlKey) this.querySelectorAll('commit.selected').forEach(c => c.classList.remove('selected'));
		event.currentTarget.classList.add('selected');

		// TODO get the other hashes
		this.postMessage({ command: 'diff', body: { hashes: [hash] } });
	}

	filter(event) {
		this.postMessage({ command: 'filter', body: { value: event.target.value } });
	}

	#render() {
		this.innerHTML = /*html*/`
			<input placeholder="Search" title="[grep: {search_query}] [by: {author}[,{author}]] [before: {date}] [after: {date}]" onchange="${this.handle}.filter(event);">
			<commit-list></commit-list>`;
	}

	#renderCommits(logs, append) {
		this.querySelector('commit-list').innerHTML = logs.commitList.map(c => {
			const datetime = new Date(Number(c.date) * 1000);

			return /*html*/`<commit onclick="${this.handle}.onCommitClick(event, '${c.hash}')" tabindex="0">
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
				if (i != commit.branchIndex) return '<vertix></vertix>';
				else return `<vertix class="filled" style="--branch-color: ${colors[i]};" hash="${commit.hash}" parents="${commit.parents.toString()}"></vertix>`;
			})
			.join('');
	}
	#renderEdges() {
		const vertixMap = {};
		this.querySelectorAll('vertix[hash]').forEach(v => vertixMap[v.getAttribute('hash')] = v);

		Object.values(vertixMap).forEach(v => { // for each commit
			const parents = v.getAttribute('parents')?.split(',').filter(p => p); // remove empty parents
			v.innerHTML = parents?.reduce((html, hash) => {
				const p = vertixMap[hash] || v; // if parent is unreachable (due to filtering/paging) set the parent to itself

				const bounds = v.getBoundingClientRect();
				const parentBounds = p.getBoundingClientRect();

				let qualifier = (bounds.x - parentBounds.x < 0) ? 'right'
					: (bounds.x - parentBounds.x > 0) ? 'left'
					: '';

				if (qualifier == 'left' && this.#hasCollisions(v, p)) qualifier = 'right flip';
				if (qualifier == '' && this.#hasCollisions(v, p)) qualifier = 'orphan';
				if (v == p) qualifier = 'orphan'; // parent is unreachable

				let color = qualifier.includes('right') ? p : v;
				color = color.getAttribute('style');

				html += `<edge style="top: ${bounds.height / 2}px;
					left: ${Math.min(0, parentBounds.x - bounds.x)}px;
					width: ${Math.abs(bounds.x - parentBounds.x) - 2}px;
					height: ${Math.abs(bounds.y - parentBounds.y)}px;
					${color}"
					class="${qualifier}"></edge>`.replace(/\t|\n/g, '');

				return html;
			}, '');
		});
	}
	#hasCollisions(c, p) {
		const commit = c.parentElement;
		const parentCommit = p.parentElement;

		const list = [...commit.parentElement.children];
		const commitIndex = list.indexOf(commit);
		const parentCommitIndex = list.indexOf(parentCommit);
		const branchIndex = [...commit.children].indexOf(c);

		for (let hitTestCommit of list.slice(commitIndex + 1, parentCommitIndex)) {
			if (hitTestCommit.querySelector(`vertix:nth-child(${branchIndex + 1})`).classList.contains('filled')) return true;
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
