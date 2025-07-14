import HTMLElementBase from "../../core/html-element-base.js";

// 4600 commits -> 60k elements
class CommitList extends HTMLElementBase {
	#progress;
	#input;
	#commitList;

	connectedCallback() {
		this.#render();
		this.postMessage({ command: 'getlog' });
	}

	// MESSAGE HANDLER
	onMessage(event) {
		const message = event.data;
		if (message.command == 'state') this.#renderCommits(message.body);
		else if (message.command == 'getFileHistory') this.filterByFile(message.body)
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
		const titleAttr = (selector) => event.currentTarget.querySelector(selector)?.getAttribute('title')?.replace(/\n/g, '\\n') || '';

		const hash = event.currentTarget.getAttribute('hash');
		const message = titleAttr('.commit-body');
		const tags = titleAttr('.ic-tag');
		const isStash = event.currentTarget.classList.contains('stash');

		event.currentTarget.dataset.vscodeContext = `{ "isCommit": ${!isStash}, "hash": "${hash}", "message": "${message}", "tags": "${tags}", "isStash": ${isStash} }`;
	}
	filter(event) {
		if (event.key == 'Enter') this.postMessage({ command: 'filter', body: { value: event.target.value.trim() } });
	}
	filterByFile(filePath) {
		this.#input.value = `file: ${filePath}`
		this.filter({ target: { value: `file: ${filePath}` }, key: 'Enter' });
	}

	getSelected() {
		return Array.from(this.querySelectorAll('li.selected')).map(s => s.getAttribute('hash'));
	}

	// RENDERING
	#render() {
		this.innerHTML = /*html*/`
			<div class="progress"></div>
			<input style="display: none;" type="search" placeholder="Search" title="[grep: <search_query>] [author: <author>[,<author>]] [before: <date>] [after: <date>] | [file: <pathspec>]" onkeyup="${this.handle}.filter(event);">
			<ul style="display: none;"></ul><resizer></resizer>`;

		this.#progress = this.querySelector('.progress');
		this.#input = this.querySelector('input');
		this.#commitList = this.querySelector('ul');
	}

	#renderCommits(state) {
		this.#progress.style.display = 'none'; // hide the loading
		this.#input.style.display = '';
		this.#commitList.style.display = '';

		this.#commitList.innerHTML = state.logs.commitList.map(c => {
			const datetime = new Date(Number(c.date) * 1000);

			return /*html*/`<li onclick="${this.handle}.onClick(event)" oncontextmenu="${this.handle}.onContextMenu(event)" hash="${c.hash}" ${c.refs.stash ? 'class="stash"' : ''} branch-index="${c.branchIndex}" tabindex="0">
				${this.#renderVertex(c, state.logs.branchCount, state.logs.colors)}
				<div class="col">
					<div class="row">
						${this.#renderRefs(c, state.logs.colors)}
						<p class="commit-body" title="${this.encodeHTML(c.body)}">${c.body}</p>
					</div>
					<div class="row secondary">
						<time datetime="${c.date}" title="${datetime.toLocaleString()}">${datetime.toLocaleDateString()}</time>
						&bull;
						<address class="author" title="${this.encodeHTML(c.name)} &lt;${c.email}&gt;">${c.name}</address>
					</div>
				</div>
			</li>`

		}).join('');

		this.#renderWorkingTree(state);
		this.#renderEdges(state);
	}
	#renderWorkingTree(state) {
		const parent = state.logs.commitList.find(c => c.refs.head?.includes(state.status.current)) || { branchIndex: 0, hash: 'dnc' };
		const changes = state.status.files.length == 1 ? '1 change' : `${state.status.files.length} changes`;

		this.querySelector('ul').insertAdjacentHTML('afterbegin',`
			<li class="working-tree selected" onclick="${this.handle}.onClick(event)" hash="" tabindex="0">
				${this.#renderVertex({ hash: '', branchIndex: parent.branchIndex, parents: [parent.hash] }, state.logs.branchCount, state.logs.colors)}
				<div class="col">
					<p class="commit-body" title="Working Tree">Working Tree</p>
					<p class="row"><span class="secondary">${changes}</span> <span class="repo-state">${state.status.repoState || ''}</span></p>
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
	#renderEdges(state) {
		const workingTreeParent = state.logs.commitList.find(c => c.refs.head?.includes(state.status.current)) || { branchIndex: 0, hash: 'dnc' };
		const verts = {};
		this.querySelectorAll('vertex[hash]').forEach((v, i) => {
			verts[v.getAttribute('hash')] = {
				elem: v,
				bounds: v.getBoundingClientRect(),
				commit: i == 0 ? workingTreeParent : state.logs.commitList[i - 1], // because the working tree!!
				index: i,
			}
		});

		Object.values(verts).forEach(v => { // for each commit
			const parents = v.elem.getAttribute('parents')?.split(',').filter(p => p); // remove empty parents
			v.elem.innerHTML = parents?.reduce((html, hash) => {
				const p = verts[hash] || v; // if parent is unreachable (due to filtering/paging) set the parent to itself

				let type = (v.bounds.x < p.bounds.x) ? 'right'
					: (v.bounds.x > p.bounds.x) ? 'left'
					: '';

				const collision = this.#hasCollisions(v, p);
				if (type == 'left' && collision.child) type = 'right flip'; // child-col collision
				if (type.includes('right') && collision.parent) type = 'fastlane'; // parent-col collision
				if (type == '' && collision.child) type = 'fastlane'; // same-col collision
				if (v == p) type = 'orphan'; // parent is unreachable

				let color = type.match(/right|fastlane/) ? p : v;
				color = color.elem.getAttribute('style');

				if (type == 'fastlane') {
					html += `<edge style="
						--after-width: ${p.bounds.x}px;
						top: ${v.bounds.height / 2}px;
						left: ${-v.bounds.x}px;
						width: ${v.bounds.x}px;
						height: ${Math.abs(v.bounds.y - p.bounds.y) - 5}px;
						${color}"
						class="${type}"></edge>`.replace(/\t|\n/g, '');

				} else {
					html += `<edge style="top: ${v.bounds.height / 2}px;
						left: ${Math.min(0, p.bounds.x - v.bounds.x)}px;
						width: ${Math.abs(v.bounds.x - p.bounds.x) - 2}px;
						height: ${Math.abs(v.bounds.y - p.bounds.y)}px;
						${color}"
						class="${type}"></edge>`.replace(/\t|\n/g, '');
				}

				return html;
			}, '');
		});
	}
	#hasCollisions(vc, vp) {
		const commit = vc.elem.parentElement;
		if (commit.classList.contains('stash')) return ''; // don't care about collisions for stashes
		// if (commit.classList.contains('working-tree')) return ''; // working tree won't collide with anything...actually it can in case of detached heads

		const collision = {};
		const commitList = [...commit.parentElement.children];
		for (let hitTestCommit of commitList.slice(vc.index + 1, vp.index)) {
			if (hitTestCommit.getAttribute('branch-index') == vc.commit.branchIndex) collision.child = 1;
			if (hitTestCommit.getAttribute('branch-index') == vp.commit.branchIndex) collision.parent = 1;
		}
		return collision;
	}

	#renderRefs(commit, colors) {
		const refs = commit.refs;
		const origin = refs.origin ? `<i class="ic-origin" style="color: ${colors[commit.branchIndex]};" title="${refs.origin}"></i>` : '';
		const head = refs.head ? `<i class="ic-head" style="color: ${colors[commit.branchIndex]};" title="${refs.head}"></i>` : '';
		const branches = refs.branches.length ? `<i class="ic-branch" style="color: ${colors[commit.branchIndex]};" title="${refs.branches.join('\n')}"></i>` : '';
		const tags = refs.tags.length ? `<i class="ic-tag" style="color: ${colors[commit.branchIndex]};" title="${refs.tags.join('\n')}"></i>` : '';
		const stash = refs.stash ? `<i class="ic-stash-ref" style="color: ${colors[commit.branchIndex]};" title="Stash"></i>` : '';

		return origin + head + branches + tags + stash;
	}
}

customElements.define('mingit-commit-list', CommitList);
