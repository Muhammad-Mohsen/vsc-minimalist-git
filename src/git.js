import * as vscode from 'vscode';
import * as proc from 'child_process';

import { Extension, extensions, EventEmitter, Uri, workspace } from "vscode";
import { GitExtension } from "../typings/scmExtension";

import simpleGit, { SimpleGit } from "simple-git";

// where git commands live
export const GIT = async () => {

	const vscGit = await getVscodeGitExtension(); // used to listen to the repo opened/closed events (gitExt)
	const gitBin = await getInstalledGitBinPath(vscGit); // used to init simple-git
	const rootRepoPath = workspace.workspaceFolders[0].uri.fsPath;

	const simp = simpleGit(rootRepoPath, { binary: gitBin, maxConcurrentProcesses: 10 });

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

	// get the installed git path
	async function getInstalledGitBinPath(api) {
		try {
			api = api || await getVscodeGitExtension(); // if the api is passed in, use it directly
			return api.git.path;

		} catch (err) {
			console.error(err);
		}
	}
	// get the built-in git extension API
	async function getVscodeGitExtension() {
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
