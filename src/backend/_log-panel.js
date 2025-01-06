import * as vscode from "vscode";
import { getNonce } from "./core/utils";

export class LogPanel {

	static TYPE = "log-panel";

	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 * @type {LogPanel}
	 */
	static instance;

	_panel;
	_extensionURI;
	_disposables = [];

	/**
	 * @param {vscode.Uri} extensionURI come from the extension context (activation event, etc)
	 */
	static createOrShow(extensionURI) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (LogPanel.instance) {
			LogPanel.instance._panel.reveal(column);
			LogPanel.instance._update();
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			LogPanel.TYPE,
			"Minimalist Git",
			column || vscode.ViewColumn.One,
			{
				enableScripts: true, // Enable javascript in the webview
				localResourceRoots: [
					vscode.Uri.joinPath(extensionURI, "media"),
					vscode.Uri.joinPath(extensionURI, "out/compiled"),
				],
			}
		);

		LogPanel.instance = new LogPanel(panel, extensionURI);
	}
	static kill() {
		LogPanel.instance?.dispose();
		LogPanel.instance = undefined;
	}
	static revive(panel, extensionURI) {
		LogPanel.instance = new LogPanel(panel, extensionURI);
	}

	/**
	 * @param {vscode.WebviewPanel} panel
	 * @param {vscode.Uri} extensionURI
	 */
	constructor(panel, extensionURI) {
		this._panel = panel;
		this._extensionURI = extensionURI;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// // Handle messages from the webview
		// this._panel.webview.onDidReceiveMessage(
		//   (message) => {
		//     switch (message.command) {
		//       case "alert":
		//         vscode.window.showErrorMessage(message.text);
		//         return;
		//     }
		//   },
		//   null,
		//   this._disposables
		// );
	}

	dispose() {
		LogPanel.instance = undefined;

		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	async _update() {
		const webview = this._panel.webview;

		this._panel.webview.html = this._render(webview);
		webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case "onInfo": {
					if (!data.value) {
						return;
					}
					vscode.window.showInformationMessage(data.value);
					break;
				}
				case "onError": {
					if (!data.value) {
						return;
					}
					vscode.window.showErrorMessage(data.value);
					break;
				}
				// case "tokens": {
				//   await Util.globalState.update(accessTokenKey, data.accessToken);
				//   await Util.globalState.update(refreshTokenKey, data.refreshToken);
				//   break;
				// }
			}
		});
	}

	/**
	 * @param {vscode.Webview} webview
	 */
	_render(webview) {
		const nonce = getNonce();
		const uri = (/** @type {string} */ path) => webview.asWebviewUri(vscode.Uri.joinPath(this._extensionURI, path));

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${uri('css/reset.css')}" rel="stylesheet">
				<link href="${uri('css/vscode.css')}" rel="stylesheet">

				<script nonce="${nonce}"></script>
			</head>

			<body>
			</body>
		</html>`;
	}

}