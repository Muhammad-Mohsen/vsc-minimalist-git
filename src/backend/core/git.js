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

	function setWorkingDirectory(cwd) {
		service.cwd(cwd);
	}

	async function pull(options) {
		await service.pull(['--autostash']); // lol!! auto-stash dirty working tree!!
	}

	function push(options) {

	}

	async function log(options) {
		options ||= {};

		// git log --branches --tags --graph --format=%x1ESTART%x1E%H%x1F%D%x1F%aN%x1F%aE%x1F%at%x1F%ct%x1F%P%x1F%B%x1EEND%x1E --author-date-order
		const logs = await service.raw([
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

	function setConfig(key, val, append, scope) {
		return service.addConfig(key, val, append || false, scope || 'local');
	}
	function getConfig(key) {
	}

	function stash(options) {
		service.stash();
	}

	async function diff(options) {
		const diff = (await service.diff([...options, '--raw', '--numstat']))
			.split('\n') // split output
			.slice(0, -1); // remove empty last element

		const raw = diff.filter(d => d.startsWith(':')); // --raw output (to show added/deleted files)
		const numstat = diff.filter(d => !d.startsWith(':')); // --numstat output

		return {
			files: numstat.map((n, i) => {
				n = n.split('\t');
				return {
					insertions: parseInt(n[0]),
					deletions: parseInt(n[1]),
					path: n[2],
					working_dir: raw[i].split('\t')[0].slice(-1)
				};
			})
		};
	}
	function status() {
		return service.status(['-u', '--show-stash']);
	}

	async function state(options) {
		return {
			logs: await log(options),
			status: await status()
			// TODO add stashes
		}
	}

	return {
		setWorkingDirectory,

		pull,
		push,

		setConfig,
		getConfig,

		stash,

		state,
		log,
		status,
		diff,
	};

})();
