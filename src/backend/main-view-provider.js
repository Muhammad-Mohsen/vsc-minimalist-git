const vscode = require('vscode');

const vsc = require('./core/vsc');
const git = require('./core/git');
const util = require('./core/utils');

module.exports = class MainViewProvider {
	/** @type {vscode.WebviewView} */
	#view;
	#extensionURI;

	constructor(extensionURI) {
		this.#extensionURI = extensionURI;
		if (!vsc.workspacePath()) return;

		git.setWorkingDirectory(vsc.workspacePath());

		// on start, this fires twice, and there's no event object to check for anything...so handler assignment is delayed by a bit and a half
		setTimeout(() => git.setOnChangeListener(() => this.#onRepoChange()), 5000);

		git.repoPath().then(repoPath => {
			if (!util.sameDir(vsc.workspacePath(), repoPath)) {
				vsc.showInfoPopup('Opened repository in parent directory.');
			}
		});
	}

	async resolveWebviewView(webviewView) {
		this.#view = webviewView;

		webviewView.webview.options = this.#options();
		webviewView.webview.html = await this.#render(webviewView.webview);
		webviewView.webview.onDidReceiveMessage((message) => this.#onMessage(message));
		webviewView.onDidChangeVisibility(() => this.#onVisibilityChange());
	}

	#options() {
		return {
			enableScripts: true,
			localResourceRoots: [this.#extensionURI],
		}
	}

	/** @param {vscode.Webview} webview */
	async #render(webview) {
		const uri = (path) => webview.asWebviewUri(vscode.Uri.joinPath(this.#extensionURI, path));
		const nonce = util.getNonce(); // Use a nonce to only allow...umm...because they said to use a nonce
		const showWelcome = await this.#showWelcome();

		return /*html*/`<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource};">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${uri('src/frontend/css/reset.css')}" rel="stylesheet">
				<link href="${uri('src/frontend/css/vscode.css')}" rel="stylesheet">
				<link href="${uri('src/frontend/css/iconly.css')}" rel="stylesheet">

				<link href="${uri('src/frontend/components/toolbar/toolbar.css')}" rel="stylesheet">
				<link href="${uri('src/frontend/components/welcome/welcome.css')}" rel="stylesheet">
				<link href="${uri('src/frontend/components/commit-list/commit-list.css')}" rel="stylesheet">
				<link href="${uri('src/frontend/components/change-list/change-list.css')}" rel="stylesheet">

				<script nonce="${nonce}" type="module" src="${uri('src/frontend/core/html-element-base.js')}"></script>
				<script nonce="${nonce}" type="module" src="${uri('src/frontend/components/welcome/welcome.js')}"></script>
				<script nonce="${nonce}" type="module" src="${uri('src/frontend/components/toolbar/toolbar.js')}"></script>
				<script nonce="${nonce}" type="module" src="${uri('src/frontend/components/commit-list/commit-list.js')}"></script>
				<script nonce="${nonce}" type="module" src="${uri('src/frontend/components/change-list/change-list.js')}"></script>

			</head>
	  		<body>
				${ showWelcome
					? '<mingit-welcome></mingit-welcome>'
					: '<mingit-commit-list></mingit-commit-list><mingit-change-list></mingit-change-list>'
				}
			</body>
			</html>`;
	}

	/** @param {{ command: string, body: any }} message */
	async #onMessage(message) {
		switch (message.command) {
			case 'openfolder':
				vsc.executeCommand('vscode.openFolder');
				break;

			case 'clone':
				vsc.executeCommand('git.clone');
				break;

			case 'getstatus':
				const status = await git.status();
				this.#postMessage({ command: 'status', body: status });
				this.#setBadge(status.files.length);
				break;

			case 'getlog':
			case 'filter':
				const state = await git.state({ filters: message.body?.value });
				this.#postMessage({ command: 'state', body: state });
				this.#setBadge(state.status.files.length);
				break;

			case 'getdiff':
				git.diff(message.body.hashes).then(diff => this.#postMessage({ command: 'diff', body: diff }));
				break;

			case 'diffeditor':
				const { left, right, title } = await git.resolveDiffURIs(message.body, this.#extensionURI);
				vsc.executeCommand('vscode.diff', left, right, title);

				break;

			case 'fetch':
				await git.fetch();
				git.state({ filters: '' }).then(state => this.#postMessage({ command: 'state', body: state }));
				break;

			case 'pull':
				vsc.executeCommand('mingit.pull');
				break;

			case 'commit':
				await git.commit(message.body);
				git.state({ filters: '' }).then(state => this.#postMessage({ command: 'state', body: state }));
				break;

			case 'stage':
				await git.stage(message.body);
				git.state({ filters: '' }).then(state => this.#postMessage({ command: 'state', body: state }));
				break;

			case 'unstage':
				await git.unstage(message.body);
				git.state({ filters: '' }).then(state => this.#postMessage({ command: 'state', body: state }));
				break;

			case 'stash':
				await git.stash(message.body);
				git.state({ filters: '' }).then(state => this.#postMessage({ command: 'state', body: state }));
				break;
		}
	}

	/** @param {{ command: string, body: any }} message */
	#postMessage(message) {
		this.#view.webview.postMessage(message);
	}

	async #onRepoChange() {
		const state = await git.state({ filters: '' });
		this.#postMessage({ command: 'state', body: state });
		this.#setBadge(state.status.files.length);
	}

	async #showWelcome() {
		if (!vsc.workspaceFolder()) return true; // no workspace
		if (!(await git.isInstalled())) return true; // no git!!
		if (!await git.isRepo()) return true; // not a repo
	}

	#onVisibilityChange() {
		// update the webview on visible...when it's invisible, it won't respond to any events
		if (this.#view.visible) git.status().then(status => this.#postMessage({ command: 'status', body: status }));
	}

	#setBadge(value) {
		this.#view.badge = value ? { value, tooltip: `${value} pending changes` } : undefined;
	}
}
