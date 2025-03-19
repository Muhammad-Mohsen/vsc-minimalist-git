import HTMLElementBase from "../../core/html-element-base.js";

// 4600 commits -> 60k elements
class CommitList extends HTMLElementBase {
	#progress;

	connectedCallback() {
		this.#render();
		this.postMessage({ command: 'getlog' });
	}

	// MESSAGE HANDLER
	onMessage(event) {
		const message = event.data;
		if (message.command == 'state') this.#renderCommits(message.body);
	}

	// EVENT HANDLERS
	onClick(event) {
		let selections = this.querySelectorAll('li.selected');
		if (!event.ctrlKey || selections.length >= 2) selections.forEach(c => c.classList.remove('selected'));
		event.currentTarget.classList.add('selected');

		selections = this.querySelectorAll('li.selected');
		const hashes = Array.from(selections).map(s => s.getAttribute('hash')).reverse(); // reverse the commits so that the older is first

		// if it's a stash, diff it against its parent becuase otherwise, git won't return correct results!
		if (event.currentTarget.classList.contains('stash') && hashes.length == 1) hashes.unshift(hashes[0] + '~');

		const command = hashes.length == 1 && hashes[0] == '' ? 'getstatus' : 'getdiff';

		this.postMessage({ command: command, body: { hashes } });
	}
	onContextMenu(event) {
		// encode the newline so that it doesn't blow up the json
		const titleAttr = (selector) => event.currentTarget.querySelector(selector)?.getAttribute('title')?.replace(/\n/g, '\\n');

		const hash = event.currentTarget.getAttribute('hash');
		const message = titleAttr('.commit-body');
		const tags = titleAttr('.ic-tag');
		const isStash = event.currentTarget.classList.contains('stash');

		event.currentTarget.setAttribute('data-vscode-context', `{ "preventDefaultContextMenuItems": true, "isCommit": ${!isStash}, "hash": "${hash}", "message": "${message}", "tags": "${tags}", "isStash": ${isStash} }`);
	}
	filter(event) {
		this.postMessage({ command: 'filter', body: { value: event.target.value } });
	}

	// RENDERING
	#render() {
		this.innerHTML = /*html*/`
			<div class="progress"></div>
			<input placeholder="Search" title="[grep: {search_query}] [by: {author}[,{author}]] [before: {date}] [after: {date}]" onchange="${this.handle}.filter(event);">
			<ul></ul>`;

		this.#progress = this.querySelector('.progress');
	}

	#renderCommits(state) {
		this.#progress.style.display = 'none'; // hide the loading

		this.querySelector('ul').innerHTML = state.logs.commitList.map(c => {
			const datetime = new Date(Number(c.date) * 1000);

			return /*html*/`<li onclick="${this.handle}.onClick(event)" oncontextmenu="${this.handle}.onContextMenu(event)" hash="${c.hash}" ${c.refs.stash ? 'class="stash"' : ''} tabindex="0">
				${this.#renderVertex(c, state.logs.branchCount, state.logs.colors)}
				<div class="col">
					<div class="row">
						${this.#renderRefs(c, state.logs.colors)}
						<p class="commit-body" title="${c.body}">${c.body}</p>
					</div>
					<div class="row secondary">
						<time datetime="${c.date}" title="${datetime.toLocaleString()}">${datetime.toLocaleDateString()}</time>
						&bull;
						<address class="author" title="${c.name} &lt;${c.email}&gt;">${c.name}</address>
					</div>
				</div>
			</li>`

		}).join('');

		this.#renderWorkingTree(state);

		this.#renderEdges();
	}
	#renderWorkingTree(state) {
		const parent = state.logs.commitList.find(c => c.refs.head?.includes(state.status.current)) || { branchIndex: 0, hash: 'dnc' };

		this.querySelector('ul').insertAdjacentHTML('afterbegin', /*html*/`
			<li class="working-tree selected" onclick="${this.handle}.onClick(event)" hash="" tabindex="0">
				${this.#renderVertex({ hash: '', branchIndex: parent.branchIndex, parents: [parent.hash] }, state.logs.branchCount, state.logs.colors)}
				<div class="col">
					<p class="commit-body" title="Working Tree">Working Tree</p>
					<p class="row secondary">${state.status.files.length} change(s)</p>
				</div>
			</li>`);
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
	#hasCollisions(vc, vp) {
		const commit = vc.parentElement;
		const parentCommit = vp.parentElement;

		if (commit.classList.contains('stash')) return false; // don't care about collisions for stashes

		const list = [...commit.parentElement.children];
		const commitIndex = list.indexOf(commit);
		const parentCommitIndex = list.indexOf(parentCommit);
		const branchIndex = [...commit.children].indexOf(vc);

		for (let hitTestCommit of list.slice(commitIndex + 1, parentCommitIndex)) {
			if (hitTestCommit.querySelector(`vertex:nth-child(${branchIndex + 1})`).classList.contains('filled')) return true;
		}

		return false;
	}

	#renderRefs(commit, colors) {
		const refs = commit.refs;
		const head = refs.head ? `<i class="ic-head" style="color: ${colors[commit.branchIndex]};" title="${refs.head}"></i>` : '';
		const origin = refs.origin ? `<i class="ic-origin" style="color: ${colors[commit.branchIndex]};" title="${refs.origin}"></i>` : '';
		const branches = refs.branches.length ? `<i class="ic-branch" style="color: ${colors[commit.branchIndex]};" title="${refs.branches.join('\n')}"></i>` : '';
		const tags = refs.tags.length ? `<i class="ic-tag" style="color: ${colors[commit.branchIndex]};" title="${refs.tags.join('\n')}"></i>` : '';
		const stash = refs.stash ? `<i class="ic-stash-ref" style="color: ${colors[commit.branchIndex]};" title="Stash"></i>` : '';

		return head + origin + branches + tags + stash;
	}
}

customElements.define('mingit-commit-list', CommitList);
