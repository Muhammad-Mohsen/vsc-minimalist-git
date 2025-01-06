const vscode = require('vscode');

/** @param {vscode.ExtensionContext} context */
function VSC(context) {

	/**
	 * automatically pushes the disposable to the `subscriptions` array
	 * @param {string} name
	 * @param {(...args: any[]) => any} callback
	 */
	function registerCommand(name, callback) {
		context.subscriptions.push(vscode.commands.registerCommand(name, callback));
	}

	/**
	 * @param {string} name
	 * @param {vscode.WebviewViewProvider} provider
	 * @param {{ readonly webviewOptions?: { readonly retainContextWhenHidden?: boolean; }; }} options
	 */
	function registerWebViewProvider(name, provider, options = undefined) {
		context.subscriptions.push(vscode.window.registerWebviewViewProvider(name, provider, options));
	}

	/**
	 * @param {string} message
	 * @param {any[]} items
	 */
	function showInfoPopup(message, ...items) {
		return vscode.window.showInformationMessage(message, ...items);
	}

	function showWarningPopup(message, ...items) {
		return vscode.window.showWarningMessage(message, ...items);
	}

	/**
	 * @param {string} message
	 * @param {any[]} items
	 */
	function showErrorPopup(message, ...items) {
		return vscode.window.showErrorMessage(message, ...items);
	}

	function workingDirectory() {
		return vscode.workspace.workspaceFolders[0].uri.fsPath;
	}

	return {
		registerCommand,

		registerWebViewProvider,

		showInfoPopup,
		showWarningPopup,
		showErrorPopup,

		workingDirectory,
	}
};

module.exports = VSC;