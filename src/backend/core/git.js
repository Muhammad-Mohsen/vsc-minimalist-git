const simpleGitModule = require('simple-git');

// git wrapper
module.exports = (() => {
	const abortController = new AbortController();
	const service = simpleGitModule.simpleGit({
		abort: abortController.signal // abortController.abort();
	});

	/*
		// custom error handler
		// https://github.com/steveukx/git-js/blob/main/docs/PLUGIN-ERRORS.md
		errors(error, result) {
			// optionally pass through any errors reported before this plugin runs
			if (error) return error;

			// customise the `errorCode` values to treat as success
			if (result.exitCode == 0) {
				return;
			}

			// the default error messages include both stdOut and stdErr, but that
			// can be changed here, or completely replaced with some other content
			return Buffer.concat([...result.stdOut, ...result.stdErr]);
		}
	*/

	/** @param {string} cwd */
	function setWorkingDirectory(cwd) {
		service.cwd(cwd);
	}

	/** @param {string[]} [options] */
	async function pull(options) {
		await service.pull(['--autostash']); // lol!! auto-stash dirty working tree!!
	}

	/** @param {string[]} [options] */
	function push(options) {

	}

	/** @param {any} [options] */
	async function log(options) {
		options ||= {};

		// git log --branches --tags --graph --format=%x1ESTART%x1E%H%x1F%D%x1F%aN%x1F%aE%x1F%at%x1F%ct%x1F%P%x1F%B%x1EEND%x1E --author-date-order
		const logs = await service.raw([ // ?.cwd(repo || this.rootRepoPath).raw
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
			// '--topo-order',
			// `--grep=${options.search}`,
			// `-n ${options.maxLength}`,
			// `-${options.count}`,
			// options.skip ? `--skip=${options.skip}` : '', // should probably use 'before <hash>'
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
				else if (r) refs.branches.push(r);
				return refs;

			}, { branches: [], tags: [] });

			if (branchIndex + 1 > response.branchCount) response.branchCount = branchIndex + 1;
			response.commitList.push({ branchIndex, hash, refs, parents: parents?.split(' ') || [], name, email, date, committerDate, body });

			return response;

		}, { // accumulator
			commitList: [],
			branchCount: 0,
			colors: ['#0085d9', '#d9008f', '#00d90a', '#d98500', '#a300d9', '#ff0000', '#00d9cc', '#e138e8', '#85d900', '#dc5b23', '#6f24d6', '#ffcc00'],
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

	/**
	 * @param {string} key
	 * @param {string} val
	 * @param {boolean} [append]
	 * @param { 'local' | 'global' | 'system' | 'worktree' } [scope]
	 */
	function setConfig(key, val, append, scope) {
		return service.addConfig(key, val, append || false, scope || 'local');
	}
	/**
	 * @param {any} key
	 */
	function getConfig(key) {
	}

	/** @param {string[]} [options] */
	function stash(options) {
		service.stash();
	}

	/**
	 * @param {any} options
	 */
	function status(options) {

	}
	async function isDirty() {
		return await service.status({ '--untracked-files': 'no', '--porcelain': null });
	}

	return {
		setWorkingDirectory,

		pull,
		push,

		setConfig,
		getConfig,

		stash,

		log,
		status,
		isDirty,

	};

})();
