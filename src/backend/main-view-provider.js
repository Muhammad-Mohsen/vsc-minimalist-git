const vscode = require('vscode');

const vsc = require('./core/vsc');
const git = require('./core/git');
const util = require('./core/utils');

module.exports = class MainViewProvider {

	#WATCHER_DEBOUNCE = 2000;
	#WATCHER_DELAY = 500;
	#watcherDispatchTimeout;
	#lastWatcherEventTimestamp = Date.now();

	/** @type {vscode.WebviewView} */
	#view;
	#extensionURI;

	constructor(context) {
		this.#extensionURI = context.extensionUri;
		if (!vsc.workspacePath()) return;

		git.setWorkingDirectory(vsc.workspacePath());

		git.repoPath().then(repoPath => {
			git.setRepoPath(repoPath);
			if (!util.sameDir(vsc.workspacePath(), repoPath)) {
				git.setWorkingDirectory(repoPath);
				vsc.showInfoPopup('Opened repository in parent directory.');
			}

			const watcher = vsc.fileSystemWatcher(context, repoPath);
			watcher.onDidChange((event) => this.#onRepoChange(event));
			watcher.onDidCreate((event) => this.#onRepoChange(event));
			watcher.onDidDelete((event) => this.#onRepoChange(event));
		});
	}

	// message: { command: string, body: any }
	async #onMessage(message) {
		try {
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
					if (message.body.decorator == '(!)') {
						vsc.executeCommand('git.openMergeEditor', git.absoluteURI(message.body.path));
						break;
					}
					const { left, right, title } = await git.resolveDiffURIs(message.body, this.#extensionURI);
					vsc.executeCommand('vscode.diff', left, right, title);

					break;

				case 'fetch':
					await git.fetch();
					break;

				case 'push':
					await git.push();
					break;

				case 'pull':
					await git.pull();
					break;

				case 'commit':
					if (this.emptyFileList(message)) break;
					await git.commit(message.body);
					break;

				case 'discard':
					if (this.emptyFileList(message)) break;

					const confirm = await vsc.showWarningPopup(`This will discard: "${[message.body.trackedFiles, message.body.untrackedFiles].flat().join('" & "')}".`, 'Confirm', 'Cancel');
					if (confirm != 'Confirm') break;

					await git.discard(message.body);
					break;

				case 'stage':
					if (this.emptyFileList(message)) break;
					await git.stage(message.body);
					break;

				case 'unstage':
					if (this.emptyFileList(message)) break;
					await git.unstage(message.body);
					break;

				case 'stash':
					if (this.emptyFileList(message)) break;
					await git.saveStash(message.body);
					break;
			}
			this.#postMessage({ command: 'hideprogress' });

		} catch (err) {
			vsc.showErrorPopup(err.message);
			this.#postMessage({ command: 'hideprogress' });
		}
	}
	async onContext(message) {
		try {
			switch (message.command) {
				case 'refresh':
					this.#refresh();
					break;

				case 'addtag':
					const nameToAdd = await vsc.showInputBox({ placeHolder: 'Enter tag name' });
					if (!nameToAdd?.trim()) return;

					await git.addTag([nameToAdd, message.body.hash]); // adding tags doesn't dispatch the repo change event
					this.#refresh();
					break;

				case 'deletetag':
					const nameToDelete = await vsc.showQuickPick(message.body.tags.split('\n'), { placeHolder: 'Select tag to delete', canPickMany: false });
					if (!nameToDelete) break;;

					const confirmed = await vsc.showWarningPopup(`This will delete "${nameToDelete}"`, 'Confirm', 'Cancel');
					if (confirmed != 'Confirm') break;

					await git.deleteTag(nameToDelete);
					this.#refresh();
					break;

				case 'copyhash':
					vsc.copyToClipboard(message.body.hash);
					break;

				case 'copymessage':
					vsc.copyToClipboard(message.body.message);
					break;

				case 'applystash':
					await git.applyStash(message.body);
					break;

				case 'dropstash':
					const dropStashConfirm = await vsc.showWarningPopup(`This will drop "${message.body.message}"`, 'Confirm', 'Cancel');
					if (dropStashConfirm != 'Confirm') break;

					await git.dropStash(message.body);
					this.#refresh();
					break;

				case 'forcepush':
					await git.push(['--force']);
					break;

				case 'amendcommit':
					await git.commit({ files: message.body.files.split(';').filter(f => f), amend: true });
					break;

				case 'checkoutcommit':
					await git.checkoutCommit(message.body);
					break;

				case 'cherrypickcommit':
					await git.cherryPickCommit(message.body);
					this.#postMessage({ command: 'commitmessage', body: { message: message.body.message } });
					break;

				case 'revertcommit':
					await git.revertCommit(message.body);
					this.#postMessage({ command: 'commitmessage', body: { message: `This reverts ${message.body.hash}.` } });
					break;

				case 'interactiverebase':
					await git.rebase(['-i', message.body.hash + '~1']);
					break;

				case 'mergecommitintocurrent':
					await git.merge([message.body.hash]);
					break;

				case 'resetbranchtocommit':
					const resetConfirmed = await vsc.showWarningPopup(`This will hard-reset the branch to commit "${message.body.hash}"`, 'Confirm', 'Cancel');
					if (resetConfirmed != 'Confirm') break;

					await git.reset(['--hard', message.body.hash]);
					break;

				case 'continuerebase':
					const crr = await git.continueSequencer('rebase');
					if (crr) vsc.showErrorPopup(crr);
					break;

				case 'abortrebase':
					const arr = await git.abortSequencer('rebase');
					if (arr) vsc.showErrorPopup(arr);
					break;

				case 'continuemerge':
					const cmr = await git.continueSequencer('merge');
					if (cmr) vsc.showErrorPopup(cmr);
					break;

				case 'abortmerge':
					const amr = await git.abortSequencer('merge');
					if (amr) vsc.showErrorPopup(amr);
					break;

				case 'continuecherrypick':
					const ccpr = await git.continueSequencer('cherry-pick');
					if (ccpr) vsc.showErrorPopup(ccpr);
					break;

				case 'abortcherrypick':
					const accpr = await git.abortSequencer('cherry-pick');
					if (accpr) vsc.showErrorPopup(accpr);
					break;

				case 'renamebranch':
					const name = await vsc.showInputBox({ placeHolder: 'Enter new branch name' });
					git.branch(['-M', name]);
					break;

				case 'changeauthor':
					const tokenizeInput = value => {
						let [user, email] = value.split('<');
						user = user.replace(/\s{2,}/g, ' ').trim();
						email = email.replace(/<|>/g, '').replace(/\s{2,}/g, ' ').trim();

						return { user, email };
					}
					const validateInput = value => {
						const { user, email } = tokenizeInput(value);

						if (!user) return 'Please enter a username';
						if (!email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/)) return 'Please enter a valid email';
						return '';
					}

					const author = await vsc.showInputBox({
						placeHolder: 'user <email>',
						validateInput: validateInput
					});

					const { user, email } = tokenizeInput(author);

					git.setConfig('user.name', user)
					git.setConfig('user.email', email);

					break;
			}
			this.#postMessage({ command: 'hideprogress' });

		} catch (err) {
			vsc.showErrorPopup(err.message || err);
			this.#postMessage({ command: 'hideprogress' });
		}
	}
	#postMessage(message) {
		this.#view?.webview?.postMessage(message);
	}

	async #onRepoChange(event) {
		if (event.path.match(/.git\/index.lock$/)) return; // ignore index.lock changes?
		// this.#refresh();

		// if we refreshed within the last 5 seconds, ignore the event
		if (Date.now() - this.#lastWatcherEventTimestamp < this.#WATCHER_DEBOUNCE) return;

		// otherwise, schedule a refresh in 1 sescond time.
		// this to ensure that if a multiple git commands are running one after the other (for example, when committing, git add + git commit are executed),
		// we wait until everything finishes
		clearTimeout(this.#watcherDispatchTimeout);
		this.#watcherDispatchTimeout = setTimeout(() => {
			this.#refresh();
			this.#lastWatcherEventTimestamp = Date.now();

		}, this.#WATCHER_DELAY);
	}

	#setBadge(value) {
		this.#view.badge = value ? { value, tooltip: `${value} pending changes` } : { value: undefined };
	}

	#refresh() {
		git.state({ filters: '' }).then(state => {
			this.#postMessage({ command: 'state', body: state });
			this.#setBadge(state.status.files.length);
		});
	}

	async #showWelcome() {
		if (!vsc.workspaceFolder()) return true; // no workspace
		if (!(await git.isInstalled())) return true; // no git!!
		if (!await git.isRepo()) return true; // not a repo
	}

	emptyFileList(message) {
		const empty = !message.body.files?.length;
		if (empty) vsc.showWarningPopup(`Please select which file(s) to ${message.command}!`);
		return empty;
	}

	async resolveWebviewView(webviewView) {
		this.#view = webviewView;

		webviewView.webview.options = this.#options();
		webviewView.webview.html = await this.#render(webviewView.webview);
		webviewView.webview.onDidReceiveMessage((message) => this.#onMessage(message));
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
				<link href="${uri('src/frontend/css/seti.css')}" rel="stylesheet">

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
	  		<body data-vscode-context='{ "preventDefaultContextMenuItems": true }'>
				${showWelcome
					? '<mingit-welcome></mingit-welcome>'
					: '<mingit-commit-list></mingit-commit-list><mingit-change-list style="display: none;"></mingit-change-list>'
				}
			</body>
			</html>`;
	}
}
