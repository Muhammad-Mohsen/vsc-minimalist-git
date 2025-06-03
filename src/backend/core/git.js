const vsc = require('./vsc');
const proc = require('child_process');
const { pathExists } = require('./utils');

// git wrapper
module.exports = (() => {

	const PAGE_SIZE = 500;
	const PATH_SEPARATOR = /\\|\//;

	let builtInGit; // builtInGit.git.path
	vsc.gitExtension().then(git => builtInGit = git);

	let cwd, repoDir;

	// INITIALIZATION
	function setWorkingDirectory(workingDirectory) {
		cwd = workingDirectory;
	}
	function setRepoPath(path) {
		repoDir = path;
	}

	// COMMANDS
	async function fetch(options = []) {
		return await gitcommand(['fetch', ...options])
	}
	async function pull(options = ['--rebase', '--autostash']) { // lol!! auto-stash dirty working tree!!
		return await gitcommand(['pull', ...options])
	}
	async function push(options = []) {
		return await gitcommand(['push', ...options])
	}

	async function stage(options) {
		if (options.files.length) return await gitcommand(['add', ...options.files]);
	}
	async function unstage(options) {
		if (options.files.length) return await gitcommand(['reset', 'HEAD', '--', ...options.files]);
	}
	async function commit(options) {
		await stage(options);
		if (!options.amend) return await gitcommand(['commit', '-m', options.message]);
		else return await gitcommand(['commit', '--amend']);
	}
	async function discard(options) {
		// tracked
		if (options.trackedFiles?.length) {
			await gitcommand(['reset', '--', ...options.trackedFiles]); // unstage the file first
			try { await gitcommand(['checkout', '--', ...options.trackedFiles]); } // blows up for renamed files
			catch {};
		}

		// untracked
		if (options.untrackedFiles?.length) {
			await gitcommand(['clean', '-f', '--', ...options.untrackedFiles]);
		}
	}
	async function saveStash(options) {
		await stage(options);
		if (options.files.length) return await gitcommand(['stash', 'push', options.message ? `--m=${options.message}` : '', ...options.files].filter(o => o));
	}
	async function applyStash(options) {
		return await gitcommand(['stash', 'apply', options.hash]);
	}
	async function dropStash(options) {
		return await gitcommand(['stash', 'drop', options.hash]);
	}

	async function checkoutCommit(options) {
		return await gitcommand(['checkout', options.hash]);
	}
	async function cherryPickCommit(options) {
		return await gitcommand(['cherry-pick', '-n', options.hash]);
	}
	async function revertCommit(options) {
		return await gitcommand(['revert', '-n', options.hash]);
	}
	async function rebase(options) {
		return await gitcommand(['rebase', ...options]);
	}
	async function merge(options) {
		return await gitcommand(['merge', ...options]);
	}
	async function reset(options) {
		return await gitcommand(['reset', ...options]);
	}

	async function addTag(options) {
		await gitcommand(['tag', ...options]);
		return await gitcommand(['push', 'origin', '--tags']);
	}
	async function deleteTag(name) {
		await gitcommand(['tag', '-d', name]);
		return await gitcommand(['push', 'origin', '--delete', name]);
	}

	// used for renaming branches
	async function branch(options) {
		return await gitcommand(['branch', ...options]);
	}
	async function setConfig(key, val, append = false, scope = 'local') {
		return await gitcommand(['config', key, val]);
	}
	function getConfig(key) {}

	// sequencer
	async function abortSequencer(command) {
		return await gitcommand([command, '--abort']);
	}
	async function continueSequencer(command) {
		return await gitcommand([command, '--continue']);
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
		// git log HEAD --branches --remotes --tags --graph --format=%x1ESTART%x1E%H%x1F%D%x1F%aN%x1F%aE%x1F%at%x1F%ct%x1F%P%x1F%B%x1EEND%x1E --author-date-order
		const logs = await gitcommand([
			'log',
			// hash, ref, parents, author name, author email, author date, committer date, raw body
			`--format=%x1ESTART%x1E${['%H', '%D', '%P', '%aN', '%aE', '%at', '%ct', '%B'].join('%x1F')}%x1EEND%x1E`,
			'HEAD',
			'--branches',
			'--remotes',
			'--tags',
			'--graph',
			'--author-date-order',
			`--max-count=${PAGE_SIZE}`,
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
		let repoState = '';
		const stateFiles = {
			MERGE_HEAD: 'merge',
			REBASE_HEAD: 'rebase',
			REVERT_HEAD: 'revert',
			CHERRY_PICK_HEAD: 'cherry-pick',
			// BISECT_LOG: 'bisection'
		};
		for (let file of Object.keys(stateFiles)) {
			if (pathExists(absoluteURI('.git/' + file))) {
				repoState = stateFiles[file] + ' in progress';
				break;
			}
		}

		// file status + current branch
		const status = (await gitcommand(['status', '-b', '-u', '--porcelain'])).split('\n').filter(s => s);
		const current = status[0] ? status[0].substring(3).replace(/\.\.\..+/, '').replace(/ \(no branch\)/i, '') : '';
		const files = status.slice(1).map(s => {
			let index = s[0].trim();
			let working = s[1].trim();

			// conflicted
			if ((working + index).match(/AA|DD|U/)) {
				working = '(!)';
				index = '';
			}

			if (index == '?') index = ''; // untracked
			if (index) index = `(${index})`;
			if (working == '?') working = 'U'; // untracked

			return {
				decorator: [index, working].filter(i => i).join(' '),
				path: s.slice(3),
				name: s.slice(3).split(PATH_SEPARATOR).pop()
			}
		});

		return {
			repoState,
			current,
			files
		};
	}
	async function listStash(options = {}) {
		const stashes = await gitcommand([
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
			? await gitcommand(['show', options[0], '--raw', '--numstat', '--oneline'])
			: await gitcommand(['diff', options.join('..'), '--raw', '--numstat']);

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
		const titlePrefix = '⇌ '; // ᴅɪꜰꜰ • // 𝗗𝗜𝗙𝗙 // ⇄ ⇌ ⇵ ⇃↾ ⥯ ↳↰
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
			right: absoluteURI(file.path),
			title: `${titlePrefix} ${file.name}` // vscode adds its own decorator
		};

		// added -> use git URI (curr hash)
		if (file.decorator.includes('A')) {
			if (file.decorator.includes('M')) return { // added, then modified -> use file path
				left: empty,
				right: absoluteURI(file.path),
				title: `${titlePrefix} ${file.name}` // vscode adds its own decorator
			};

			if (file.decorator.includes('D')) return { // added, then deleted -> use the index
				right: await uri(file.path, file.hashes[1]),
				left: empty,
				title: `${titlePrefix} ${file.name} ${file.decorator}`
			}

			return {
				left: empty,
				right: await uri(file.path, file.hashes[1]),
				title: `${titlePrefix} ${file.name} ${file.decorator}`
			};
		}

		// deleted -> use git URI (prev hash)
		if (file.decorator == 'D') return {
			left: await uri(file.path, file.hashes[0]),
			right: empty,
			title: `${titlePrefix} ${file.name} ${file.decorator}`
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
					title: titlePrefix + file.path.replace('=>', '→')
				}

			}

			const [l, r] = file.path.split(' => ');
			return {
				left: await uri(l, file.hashes[0]),
				right: await uri(r, file.hashes[1]),
				title: titlePrefix + file.path.replace('=>', '→')
			}
		}

		// else
		return {
			left: await uri(file.path, file.hashes[0]) || empty,
			right: file.hashes[1] == '' ? absoluteURI(file.path) : await uri(file.path, file.hashes[1]) || empty,
			title: titlePrefix + (file.hashes[1] == '' ? file.name : `${file.name} ${file.decorator}`)
		}
	}

	// UTILS
	async function isInstalled() {
		try {
			await gitcommand(['--version']);
			return true;
		} catch {
			return false;
		}
	}
	async function isRepo() {
		const status = await gitcommand(['status']);
		return !status.startsWith('fatal:');
	}
	async function repoPath() {
		return await gitcommand(['rev-parse', '--show-toplevel']);
	}

	async function uri(path, ref) {
		if (await uriExists(path, ref)) return builtInGit.toGitUri(absoluteURI(path), ref);
	}
	function absoluteURI(path) {
		return vsc.joinPath(repoDir, path);
	}
	async function uriExists(path, ref) {
		const exists = await gitcommand(['cat-file', '-e', `${ref}:${path}`]);
		return !exists.startsWith('fatal:');
	}

	// git process/command
	const gitCommandQueue = {};
	function gitcommand(options) {
		// if a similar command is already running, abort it...or should I ignore the new one instead?
		gitCommandQueue[options[0]]?.kill();
		delete gitCommandQueue[options[0]];

		return new Promise((resolve, reject) => {
			const p = proc.spawn('git', options, { cwd });
			gitCommandQueue[options[0]] = p;

			let data = '';
			p.stdout.on('data', stream => data += stream.toString()); // apparently using += is plenty efficient!
			p.stderr.on('data', stream => data += stream.toString());

			p.once('error', err => {
				reject(err);
				delete gitCommandQueue[options[0]];
			});
			p.once('exit', () => {
				data = data.replace(/\n$/, ''); // remove the trailing '\n' (if any)
				if (data.startsWith('fatal:')) reject(data); // reject error outputs
				else resolve(data);

				delete gitCommandQueue[options[0]];
			});
		});
	}

	return {
		isInstalled,
		setWorkingDirectory,
		setRepoPath,
		isRepo,
		repoPath,

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
		rebase,
		merge,
		reset,

		continueSequencer,
		abortSequencer,

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
		absoluteURI,
	};

})();
