const simpleGitModule = require('simple-git');
const vsc = require('./vsc');

// git wrapper
module.exports = (() => {

	const PAGE_COUNT = 500;
	const PATH_SEPARATOR = /\\|\//;

	let onchange; // repo change handler

	let builtInGit;
	vsc.gitExtension().then(git => {
		builtInGit = git;

		builtInGit.onDidOpenRepository(repo => {
			repo.state.onDidChange((event) => { // TODO dispose!
				onchange?.();
				console.log('onDidChange', event);
			});
		});
	});

	const abortController = new AbortController();
	const simpleGit = simpleGitModule.simpleGit({
		abort: abortController.signal // abortController.abort();
	});

	// INITIALIZATION
	function setWorkingDirectory(cwd) {
		simpleGit.cwd(cwd);
	}
	function setOnChangeListener(listener) {
		onchange = listener;
	}

	// COMMANDS
	function fetch(options) {
		return simpleGit.fetch(options);
	}
	function pull(options = ['--rebase', '--autostash']) { // lol!! auto-stash dirty working tree!!
		return simpleGit.pull(options);
	}
	async function push(options) {
		return await simpleGit.push(options);
	}

	async function commit(options) {
		if (options.files) {
			await simpleGit.add(options.files);
			return simpleGit.commit(options.message, options.files);
		}

		return await simpleGit.raw(['commit', ...options]);
	}
	async function stage(options) {
		return await simpleGit.add(options.files);
	}
	async function unstage(options) {
		return await simpleGit.reset(['HEAD', '--', ...options.files]);
	}
	async function discard(options) {
		try {
			// git files
			await simpleGit.reset(['--', ...options.files]); // unstage the file first
			return await simpleGit.checkout(['--', ...options.files]);

		} catch {
			// untracked files
			return await simpleGit.clean(simpleGitModule.CleanOptions.FORCE, options.files);
		}

	}
	async function saveStash(options) {
		await simpleGit.add(options.files);
		return simpleGit.stash(['save', options.message ? `--m=${options.message}` : '', ...options.files].filter(o => o));
	}
	async function applyStash(options) {
		return simpleGit.stash(['apply', options.hash]);
	}
	async function dropStash(options) {
		return simpleGit.stash(['drop', options.hash]);
	}

	async function checkoutCommit(options) {
		return await simpleGit.checkout([options.hash]);
	}
	async function cherryPickCommit(options) {
		return await simpleGit.raw(['cherry-pick', '-n', options.hash]);
	}
	async function revertCommit(options) {
		return await simpleGit.raw(['revert', '-n', options.hash]);
	}

	async function addTag(options) {
		await simpleGit.tag(options);
		await simpleGit.push(['origin', '--tags']);
	}
	async function deleteTag(name) {
		await simpleGit.tag(['-d', name]);
		await simpleGit.push(['origin', '--delete', name]);
	}

	async function branch(options) {
		return await simpleGit.branch(options);
	}
	function setConfig(key, val, append, scope) {
		return simpleGit.addConfig(key, val, append || false, scope || 'local');
	}
	function getConfig(key) {
	}

	// GRAPH
	async function state(options) {
		const state = {
			logs: await log(options),
			stashes: await listStash(options),
			status: await status(),
		}

		if (!state.stashes.length) return state;

		// group stashes by parent hash
		const stashMap = state.stashes.reduce((map, s) => {
			s.branchIndex = state.logs.branchCount; // set the stashes to display at a separate lane
			if (map[s.parents[0]]) map[s.parents[0]].push(s);
			else map[s.parents[0]] = [s];

			return map;
		}, {});

		state.logs.branchCount++; // account for the stashes

		Object.keys(stashMap).forEach(h => {
			const i = state.logs.commitList.findIndex(c => c.hash == h);
			state.logs.commitList.splice(i, 0, ...stashMap[h]);
		});

		return state;
	}
	async function log(options = {}) {
		// git log --branches --tags --graph --format=%x1ESTART%x1E%H%x1F%D%x1F%aN%x1F%aE%x1F%at%x1F%ct%x1F%P%x1F%B%x1EEND%x1E --author-date-order
		const logs = await simpleGit.raw([
			'log',
			// hash, ref, parents, author name, author email, author date, committer date, raw body
			`--format=%x1ESTART%x1E${['%H', '%D', '%P', '%aN', '%aE', '%at', '%ct', '%B'].join('%x1F')}%x1EEND%x1E`,
			'--branches',
			'--remotes',
			'--tags',
			'--graph',
			'--author-date-order',
			`--max-count=${PAGE_COUNT}`,
			...logFilters(options.filters),
			'-i', // case insensitive (for filtering)
		].filter(p => p));

		return logs.split('\x1EEND\x1E').reduce((response, commit) => {
			commit = commit.replace(/^\n/, '');
			if (!commit) return response;

			const [graph, hash, ref, parents, name, email, date, committerDate, rawBody] = commit.split(/\x1F|\x1ESTART\x1E/);

			// processing
			const branchIndex = graph.substring(graph.lastIndexOf('\n') + 1).indexOf('*') / 2;

			const body = rawBody
				.replace(/\n[|\\/\s]+$/, '') // remove the extra new line and trailing graph remnants!
				.replace(new RegExp(`\n.{${(branchIndex + 1) * 2}}`, 'g'), '\n'); // remove graph detritus from multi-line commit bodies

			const refs = ref.split(', ').reduce((refs, r) => {
				if (r.startsWith('tag:')) refs.tags.push(r.replace('tag: ', ''));
				else if (r.startsWith('origin')) refs.origin = r;
				else if (r.startsWith('HEAD')) refs.head = r;
				else if (r) refs.branches.push(r);

				return refs;

			}, { branches: [], tags: [], head: null, origin: null });

			if (branchIndex + 1 > response.branchCount) response.branchCount = branchIndex + 1;
			response.commitList.push({ branchIndex, hash, refs, parents: parents?.split(' ') || [], name, email, date, committerDate, body });

			return response;

		}, { // accumulator
			commitList: [],
			branchCount: 0,
			colors: ['#75BEFF', '#FFB000', '#7A457A', '#8DE8A5', '#7E86A6', '#ff0000', '##80C566', '##E552EB', '#C2C500', '#DC5B23', '#6f24d6', '#ffcc00'],
		});
	}
	function logFilters(filterString) {
		if (!filterString) return [''];

		function filterBy(by) {
			const others = ['grep', 'author', 'before', 'after'].filter(f => f != by);
			const val = filterString.replace(new RegExp(`.*${by}:`, 'i'), '').replace(new RegExp(`(${others.join('|')}):.*`, 'i'), '');

			if (!val) return '';
			else if (by == 'author') return val.split(',').filter(a => a.trim()).map(a => `--author=${a.trim()}`).join(' ');
			else return `--${by}=${val.trim()}`;
		}

		return [filterBy('grep'), filterBy('author'), filterBy('before'), filterBy('after')];
	}
	async function status() {
		const status = await simpleGit.status(['-u']);

		// repo state
		const repoState = (await simpleGit.raw(['status'])).split('\n')[1]; // we're interested in the second line of the output
		if (repoState.includes('rebase in progress')) status.repoState = 'rebasing';
		if (repoState.includes('cherry-picking')) status.repoState = 'cherry-picking';
		if (repoState.includes("merge in progress")) status.repoState = "merging";
		if (repoState.includes("revert in progress")) status.repoState = "reverting";

		// work out the decorators
		status.files = status.files.map(f => {
			f.index = f.index?.trim() || '';
			f.working_dir = f.working_dir?.trim() || '';

			// conflicted
			if ((f.working_dir + f.index).match(/AA|DD|U/)) {
				f.working_dir = '(!)';
				f.index = '';
			}

			if (f.index == '?') f.index = ''; // untracked
			if (f.index) f.index = `(${f.index})`;
			if (f.working_dir == '?') f.working_dir = 'U'; // untracked

			return {
				name: f.path.split(PATH_SEPARATOR).pop(),
				path: f.path,
				decorator: [f.index, f.working_dir].filter(i => i).join(' ')
			}
		});

		return status;
	}
	async function listStash(options = {}) {
		const stashes = await simpleGit.raw([
			'stash',
			'list',
			`--format=${['%gD', '%P', '%aN', '%aE', '%at', '%ct', '%B'].join('%x1F')}%x1E`,
			...logFilters(options.filters),
			'-i',
		].filter(p => p));

		const list = stashes.split('\x1E').reduce((response, stash) => {
			stash = stash.replace(/^\n/, '');
			if (!stash) return response;

			const [hash, parents, name, email, date, committerDate, body] = stash.split(/\x1F|\x1ESTART\x1E/);
			response.push({ hash, parents: [parents.split(' ')[0]], refs: { branches: [], tags: [], head: null, origin: null, stash: true }, name, email, date, committerDate, body });
			return response
		}, []);

		return list;
	}

	// DIFF
	async function diff(options) {
		if (options.length == 1 && options[0] == '') return status();

		let diff = options.length == 1
			? await simpleGit.show([options[0], '--raw', '--numstat', '--oneline'])
			: await simpleGit.diff([options.join('..'), '--raw', '--numstat']);

		diff = diff.split('\n')
			.slice(options.length == 1 ? 1 : 0) // remove commit data (coming from `--oneline`) if `git show` was used
			.filter(l => l);

		const raw = diff.filter(d => d.startsWith(':')); // added/deleted/renamed/etc.
		const numstat = diff.filter(d => !d.startsWith(':')); // additions/deletions

		return {
			hashes: options, // send the hashes back up so they can be used when showing the actual file diffs
			files: numstat.map((n, i) => {
				n = n.split('\t');

				let decorator = raw[i] ? raw[i].split('\t')[0].slice(-1) : ''; // for merge commits, 'raw' is empty, apparently
				if (n[2].includes('=>')) decorator = 'R';
				else if ([' ', 'M'].includes(decorator)) decorator = '';
				else if (decorator == '?') decorator = 'U';

				return {
					name: n[2].split(PATH_SEPARATOR).pop(),
					path: n[2],
					decorator: decorator,
					insertions: parseInt(n[0]),
					deletions: parseInt(n[1]),
				};
			})
		};
	}
	// getting the diff URIs is a wonderful mess! and that's not even everything
	async function resolveDiffURIs(file, extensionURI) {
		const empty = vsc.joinPath(extensionURI, 'res', 'git-empty.txt');

		if (file.hashes[0] == '') {
			file.hashes[0] = 'HEAD';
			file.hashes[1] = '';

		} else if (file.hashes.length == 1) {
			file.hashes[1] = file.hashes[0];
			file.hashes[0] += '~';
		}

		// untracked -> use actual file system URI
		if (file.decorator == 'U') return {
			left: empty,
			right: vsc.absoluteURI(file.path),
			title: `${file.name}` // vscode adds its own decorator
		};

		// added -> use git URI (curr hash)
		if (file.decorator.includes('A')) {
			if (file.decorator.includes('M')) return { // added, then modified -> use file path
				left: empty,
				right: vsc.absoluteURI(file.path),
				title: `${file.name}` // vscode adds its own decorator
			};

			if (file.decorator.includes('D')) return { // added, then deleted -> use the index
				right: await uri(file.path, file.hashes[1]),
				left: empty,
				title: `${file.name} ${file.decorator}`
			}

			return {
				left: empty,
				right: await uri(file.path, file.hashes[1]),
				title: `${file.name} ${file.decorator}`
			};
		}

		// deleted -> use git URI (prev hash)
		if (file.decorator == 'D') return {
			left: await uri(file.path, file.hashes[0]),
			right: empty,
			title: `${file.name} ${file.decorator}`
		};

		// renamed
		if (file.decorator == 'R') {
			// if only a path segment changes
			if (file.path.includes('{')) {
				const lr = file.path.match(/({.+})/)[0];
				const [l, r] = lr.slice(1, -1).split(' => ');

				return {
					// remove possible double slashes (e.g. {folderA => })
					left: await uri(file.path.replace(lr, l).replace(/\/\//g, '/'), file.hashes[0]),
					right: await uri(file.path.replace(lr, r).replace(/\/\//g, '/'), file.hashes[1]),
					title: file.path.replace('=>', '→')
				}

			}

			const [l, r] = file.path.split(' => ');
			return {
				left: await uri(l, file.hashes[0]),
				right: await uri(r, file.hashes[1]),
				title: file.path.replace('=>', '→')
			}
		}

		// else
		return {
			left: await uri(file.path, file.hashes[0]) || empty,
			right: file.hashes[1] == '' ? vsc.absoluteURI(file.path) : await uri(file.path, file.hashes[1]) || empty,
			title: file.hashes[1] == '' ? file.name : `${file.name} ${file.decorator}`
		}
	}

	// UTILS
	async function isInstalled() {
		try {
			await simpleGit.version();
			return true;
		} catch {
			return false;
		}
	}
	async function isRepo() {
		return await simpleGit.checkIsRepo();
	}
	async function repoPath() {
		// return builtInGit.repositories[0].rootUri.fsPath;
		// or
		return await simpleGit.revparse(['--show-toplevel']);
	}

	async function uri(path, ref) {
		if (await uriExists(path, ref)) return builtInGit.toGitUri(vsc.absoluteURI(path), ref);
	}
	async function uriExists(path, ref) {
		 try {
			const err = await simpleGit.catFile(['-e', `${ref}:${path}`]);
			return true;

		} catch { return false; }
	}

	return {
		isInstalled,
		setWorkingDirectory,
		isRepo,
		repoPath,
		setOnChangeListener,

		fetch,
		pull,
		push,
		commit,
		stage,
		unstage,
		discard,

		checkoutCommit,
		cherryPickCommit,
		revertCommit,

		applyStash,
		saveStash,
		dropStash,
		listStash,

		addTag,
		deleteTag,

		branch,
		setConfig,
		getConfig,

		state,
		log,
		status,

		diff,
		resolveDiffURIs,

		uri,

	};

})();
