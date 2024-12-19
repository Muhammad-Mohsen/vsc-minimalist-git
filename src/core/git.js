import { extensions, EventEmitter, Uri, workspace } from "vscode";

import * as proc from 'child_process';
// import { GitExtension } from "../typings/scmExtension";
import simpleGit from "simple-git";

// where git commands live
export const GIT = async () => {

	let binPath;

	const service = simpleGit(workspace.workspaceFolders[0].uri.fsPath, {
		binary: await gitBinPath(),
		maxConcurrentProcesses: 5
	});

	// this.initializeReposEvents();

	function pull(options = {}) {

	}

	function push(options = {}) {

	}

	function log(options = {}) {

	}

	function setConfig(key, val, global = false) {

	}
	function getConfig(options) {

	}

	// get the installed git path - used to listen to the repo opened/closed events (gitExt)
	async function gitBinPath() {
		try {
			binPath ||= (await vsCodeGITExtension()).git.path;
			return binPath;

		} catch (err) {
			console.error(err);
		}
	}
	// get the built-in git extension API
	async function vsCodeGITExtension() {
		try {
			const extension = extensions.getExtension('vscode.git');
			if (!extension) return;

			const gitExtension = extension.isActive ? extension.exports : await extension.activate();
			return gitExtension.getAPI(1);

		} catch (err) {
			console.error(err);
		}
	}

	return {
		pull,
		push,
		log
	};

};
