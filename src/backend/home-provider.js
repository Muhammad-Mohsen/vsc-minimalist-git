const vscode = require('vscode');

const VSC = require('./core/vsc');
const GIT = require('./core/git');
const util = require('./core/utils');

module.exports = class HomeViewProvider {
	/** @type {vscode.WebviewView} */
	_view;

	_extensionURI;

	/** @param {vscode.Uri} extensionURI */
	constructor(extensionURI) { this._extensionURI = extensionURI; }

	/** @param {vscode.WebviewView} webviewView */
	resolveWebviewView(webviewView) {
		this._view = webviewView;

		webviewView.webview.options = this._options();
		webviewView.webview.html = this._render(webviewView.webview);
		webviewView.webview.onDidReceiveMessage(this._onMessage);
		webviewView.onDidChangeVisibility(this._onVisibilityChange);

		// webviewView.badge = { tooltip: 'test', value: 5 };
	}

	_options() {
		return {
			enableScripts: true,
			localResourceRoots: [this._extensionURI],
		}
	}

	/** @param {vscode.Webview} webview */
	_render(webview) {
		const uri = (/** @type {string} */ path) => webview.asWebviewUri(vscode.Uri.joinPath(this._extensionURI, path));
		const nonce = util.getNonce(); // Use a nonce to only allow...umm...because they said to use a nonce

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

				<script nonce="${nonce}" type="module" src="${uri('src/frontend/core/vsc.js')}"></script>
				<script nonce="${nonce}" type="module" src="${uri('src/frontend/core/html-element-base.js')}"></script>
				<script nonce="${nonce}" type="module" src="${uri('src/frontend/components/toolbar/toolbar.js')}"></script>

			</head>
	  		<body>
				<mingit-toolbar></mingit-toolbar>
			</body>
			</html>`;
	}

	/** @param {{ command: string, body: any }} message */
	_onMessage(message) {
		switch (message.command) {
			case 'pull':
				GIT.pull()
					.then(() => VSC.showInfoPopup('pull... done'))
					.catch(reason => VSC.showErrorPopup(`pull failed ${reason.message.replace(/error:/g, '')}`));
				break;
		}
	}
	/** @param {{ command: string, body: any }} message */
	postMessage(message) {
		this._view.webview.postMessage(message);
	}

	/** @param {number} value */
	setBadge(value) {
		this._view.badge = { value, tooltip: `${value} pending changes` };
	}
	_onVisibilityChange() {
		if (this._view.visible) this._view.badge = undefined; // remove badge when webview is visible
	}
}
