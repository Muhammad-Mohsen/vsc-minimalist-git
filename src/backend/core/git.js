const vscode = require('vscode');
const simpleGitModule = require('simple-git');

// git wrapper
module.exports = (/** @type {string} */ cwd) => {
	const service = simpleGitModule.simpleGit().cwd(cwd);

	/** @param {string[]} [options] */
	async function pull(options) {
		await service.pull(['--autostash']); // lol!! auto-stash dirty working tree!!
	}

	/** @param {string[]} [options] */
	function push(options) {

	}

	/** @param {string[]} [options] */
	function log(options) {

	}

	function setConfig(key, val, global = false) {

	}
	function getConfig(key) {

	}

	/** @param {string[]} [options] */
	function stash(options) {
		service.stash()
	}

	function status(options) {

	}
	async function isDirty() {
		// git status --untracked-files=no --porcelain
		return await service.status({ '--untracked-files': 'no', '--porcelain': null });
	}

	return {
		pull,
		push,

		setConfig,
		getConfig,

		stash,

		log,
		status,
		isDirty,

	};

};
