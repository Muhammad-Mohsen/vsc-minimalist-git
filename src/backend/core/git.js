const simpleGitModule = require('simple-git');
const vsc = require('./vsc');

// git wrapper
module.exports = (() => {
	let diffCache = {};
	let onchange; // repo change handler

	let builtInGit;
	vsc.gitExtension().then(git => {
		builtInGit = git;

		builtInGit.onDidOpenRepository(repo => {
			repo.state.onDidChange((event) => { // TODO dispose!
				diffCache = {}; // purge the cache
				onchange();
				console.log('onDidChange', event);
			});
		});
	});

	const abortController = new AbortController();
	const simpleGit = simpleGitModule.simpleGit({
		abort: abortController.signal // abortController.abort();
	});

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

	function setWorkingDirectory(cwd) {
		simpleGit.cwd(cwd);
	}
	function setOnChangeListener(listener) {
		onchange = listener;
	}

	function fetch(options) {
		return simpleGit.fetch(options);
	}
	function pull(options) {
		return simpleGit.pull(['--autostash']); // lol!! auto-stash dirty working tree!!
	}
	function push(options) {

	}

	async function commit(options) {
		await simpleGit.add(options.files);
		return simpleGit.commit(options.message, options.files);
	}

	async function stash(options) {
		await simpleGit.add(options.files);
		return simpleGit.stash([options.message ? `--m=${options.message}` : '', ...options.files].filter(o => o));
	}

	async function state(options) {
		const state = {
			logs: await log(options),
			stashes: await stashList(),
			status: await status(),
		}

		if (!state.stashes.length) return state;

		// group stashes by parnet hash
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
	async function log(options) {
		options ||= {};

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
			...logFilters(options?.filters),
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
			const others = ['grep', 'by', 'before', 'after'].filter(f => f != by);
			const val = filterString.replace(new RegExp(`.*${by}:`, 'i'), '').replace(new RegExp(`(${others.join('|')}):.*`, 'i'), '');

			if (!val) return '';
			else if (by == 'by') return val.split(',').filter(a => a.trim()).map(a => `--author=${a.trim()}`).join(' ');
			else return `--${by}=${val.trim()}`;
		}

		return [filterBy('grep'), filterBy('by'), filterBy('before'), filterBy('after')];
	}
	async function status() {
		const status = await simpleGit.status(['-u']);
		status.files = status.files.map(f => {
			if (f.working_dir == 'M' && f.index == 'A') f.working_dir = 'A_M'; // added + modified
			if (f.working_dir == '?') f.working_dir = 'U'; // untracked
			return {
				name: f.path.split(/\\|\//).pop(),
				path: f.path,
				decorator: f.working_dir == ' ' ? f.index : f.working_dir
			}
		});

		return status;
	}
	async function stashList() {
		const stashes = await simpleGit.raw(['stash', 'list', `--format=${['%H', '%P', '%aN', '%aE', '%at', '%ct', '%B'].join('%x1F')}%x1E`])
		const list = stashes.split('\x1E').reduce((response, stash) => {
			stash = stash.replace(/^\n/, '');
			if (!stash) return response;

			const [hash, parents, name, email, date, committerDate, body] = stash.split(/\x1F|\x1ESTART\x1E/);
			response.push({ hash, parents: [parents.split(' ')[0]], refs: { branches: [], tags: [], head: null, origin: null, stash: true }, name, email, date, committerDate, body });
			return response
		}, []);

		return list;
	}

	function setConfig(key, val, append, scope) {
		return simpleGit.addConfig(key, val, append || false, scope || 'local');
	}
	function getConfig(key) {
	}

	async function diff(options) {
		// if (diffCache[options.join('')]) return diffCache[options[0]];

		if (options.length == 1 && options[0] == '') return status(); // working tree

		let diff = options.length == 1
			? await simpleGit.show([options[0], '--raw', '--numstat', '--oneline'])
			: await simpleGit.diff([options.join('..'), '--raw', '--numstat']);

		diff = diff
			.split('\n') // split output
			.slice(options.length == 1 ? 1 : 0) // remove commit data (coming from `--oneline`) if `git show` was used
			.filter(l => l); // remove emptis

		const raw = diff.filter(d => d.startsWith(':')); // shows state (added/deleted/renamed/etc.)
		const numstat = diff.filter(d => !d.startsWith(':')); // shows additions/deletions/etc.

		diffCache[options[0]] = {
			hashes: options, // send the hashes back up so they can be used when showing the actual file diffs
			files: numstat.map((n, i) => {
				n = n.split('\t');

				return {
					name: n[2].split(/\\|\//).pop(),
					path: n[2],
					decorator: resolveDecorator(n, raw[i]),
					insertions: parseInt(n[0]),
					deletions: parseInt(n[1]),
				};
			})
		};

		return diffCache[options[0]];
	}
	function resolveDiffURIs(file) {
		const empty = vsc.absoluteURI('../../res/git-empty.txt');

		if (file.hashes[0] == '') {
			file.hashes[0] = 'HEAD';
			file.hashes[1] = '';

		} else if (file.hashes.length == 1) {
			file.hashes[1] = file.hashes[0];
			file.hashes[0] += '~';
		}

		// untracked -> use actual file system URI
		if (['?', 'U'].includes(file.decorator)) return {
			left: empty,
			right: vsc.absoluteURI(file.path),
			title: `${file.name} (${file.decorator})`
		};

		// added -> use git URI (curr hash)
		if (['A', 'A_M'].includes(file.decorator)) return {
			left: empty,
			right: uri(file.path, file.hashes[1]),
			title: `${file.name} (${file.decorator})`
		};

		// deleted -> use git URI (prev hash)
		if (file.decorator == 'D') return {
			left: uri(file.path, file.hashes[0]),
			right: empty,
			title: `${file.name} (${file.decorator})`
		};

		// renamed
		if (file.decorator == 'R') {
			const basePath = file.path.split('/').slice(0, -1).join('/') + '/';
			const [ln, rn] = file.name.split(' => ');

			return {
				left: uri(basePath + ln, file.hashes[0]),
				right: uri(basePath + rn, file.hashes[1]),
				title: `${ln} → ${rn}`
			}
		}

		// else
		return {
			left: uri(file.path, file.hashes[0]),
			right: file.hashes[1] == '' ? vsc.absoluteURI(file.path) : uri(file.path, file.hashes[1]),
			title: file.name
		}
	}
	function resolveDecorator(numstat, raw) {
		let decorator = raw ? raw.split('\t')[0].slice(-1) : ''; // for merge commits, 'raw' is empty, apparently
		if (numstat[2].includes('=>')) decorator = 'R';
		else if ([' ', 'M'].includes(decorator)) decorator = '';
		else if (decorator == '?') decorator = 'U';
		// TODO handle conflicted status

		return decorator;
	}

	function uri(path, ref) {
		return builtInGit.toGitUri(vsc.absoluteURI(path), ref);
	}
	function shortHash(hash) {
		if (['Working Tree', 'HEAD'].includes(hash)) return hash; // special value
		return hash.substring(0, 6) + '~';
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
		stash,

		setConfig,
		getConfig,

		state,
		log,
		status,
		stashList,

		diff,
		resolveDiffURIs,

		uri,
		shortHash,

	};

})();
