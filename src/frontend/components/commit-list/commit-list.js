import HTMLElementBase from "../../core/html-element-base.js";

class CommitList extends HTMLElementBase {

	connectedCallback() {
		this.#render();
		this.postMessage({ command: 'getlog' });
	}

	onMessage(event) {
		const message = event.data;
		if (message.command == 'state') this.#renderCommits(message.body);
	}

	onCommitClick(event) {
		let selections = this.querySelectorAll('commit.selected');
		if (!event.ctrlKey || selections.length >= 2) selections.forEach(c => c.classList.remove('selected'));
		event.currentTarget.classList.add('selected');

		selections = this.querySelectorAll('commit.selected');
		const hashes = Array.from(selections).map(s => s.getAttribute('hash')).reverse(); // reverse the commits so that the older is first

		this.postMessage({ command: 'getdiff', body: { hashes } });
	}
	onWorkingTreeClick() {
		this.querySelectorAll('commit.selected').forEach(c => c.classList.remove('selected')); // clear any previously-selected commits
		this.postMessage({ command: 'getstatus' });
	}

	filter(event) {
		this.postMessage({ command: 'filter', body: { value: event.target.value } });
	}

	#render() {
		this.innerHTML = /*html*/`
			<input placeholder="Search" title="[grep: {search_query}] [by: {author}[,{author}]] [before: {date}] [after: {date}]" onchange="${this.handle}.filter(event);">
			<commit-list></commit-list>`;
	}

	#renderCommits(state) {
		this.querySelector('commit-list').innerHTML = state.logs.commitList.map(c => {
			const datetime = new Date(Number(c.date) * 1000);

			return /*html*/`<commit onclick="${this.handle}.onCommitClick(event, '${c.hash}')" hash="${c.hash}" tabindex="0">
				${this.#renderVertex(c, state.logs.branchCount, state.logs.colors)}
				<div class="col">
					<div class="row">
						${this.#renderRefs(c.refs)}
						<p class="commit-body" title="${c.body}">${c.body}</p>
					</div>
					<div class="row secondary">
						<time datetime="${c.date}" title="${datetime.toLocaleString()}">${datetime.toLocaleDateString()}</time>
						&bull;
						<address class="author" title="${c.name} &lt;${c.email}&gt;">${c.name}</address>
					</div>
				</div>
			</commit>`

		}).join('');

		this.#renderWorkingTree(state);

		this.#renderEdges();
	}
	#renderWorkingTree(state) {
		const parent = state.logs.commitList.find(c => c.refs.head?.includes(state.status.current)) || { branchIndex: 0, hash: 'dnc' };

		this.querySelector('commit-list').insertAdjacentHTML('afterbegin', /*html*/`
			<commit class="working-tree" onclick="${this.handle}.onWorkingTreeClick()" tabindex="0">
				${this.#renderVertex({ hash: '', branchIndex: parent.branchIndex, parents: [parent.hash] }, state.logs.branchCount, state.logs.colors)}
				<div class="col">
					<p class="commit-body" title="Working Tree">Working Tree</p>
					<p class="row secondary">${state.status.files.length} change(s)</p>
				</div>
			</commit>`);
	}
	#renderVertex(commit, count, colors) {
		return new Array(count).fill('')
			.map((b, i) => {
				if (i != commit.branchIndex) return '<vertex></vertex>';
				else return `<vertex class="filled" style="--branch-color: ${colors[i]};" hash="${commit.hash}" parents="${commit.parents.toString()}"></vertex>`;
			})
			.join('');
	}
	#renderEdges() {
		const vertexMap = {};
		this.querySelectorAll('vertex[hash]').forEach(v => vertexMap[v.getAttribute('hash')] = v);

		Object.values(vertexMap).forEach(v => { // for each commit
			const parents = v.getAttribute('parents')?.split(',').filter(p => p); // remove empty parents
			v.innerHTML = parents?.reduce((html, hash) => {
				const p = vertexMap[hash] || v; // if parent is unreachable (due to filtering/paging) set the parent to itself

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
			if (hitTestCommit.querySelector(`vertex:nth-child(${branchIndex + 1})`).classList.contains('filled')) return true;
		}

		return false;
	}

	#renderRefs(refs) {
		const head = refs.head ? `<i class="ic-head" title="${refs.head}"></i>` : '';
		const origin = refs.origin ? `<i class="ic-origin" title="${refs.origin}"></i>` : '';
		const branches = refs.branches.length ? `<i class="ic-branch" title="${refs.branches.join('\n')}"></i>` : '';
		const tags = refs.tags.length ? `<i class="ic-tag" title="${refs.tags.join('\n')}"></i>` : '';

		return head + origin + branches + tags;
	}
}

customElements.define('mingit-commit-list', CommitList);
