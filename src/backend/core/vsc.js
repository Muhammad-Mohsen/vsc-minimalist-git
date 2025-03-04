const vscode = require('vscode');

module.exports = (() => {

	/**
	 * automatically pushes the disposable to the `subscriptions` array
	 * @param {vscode.ExtensionContext} context
	 * @param {string} name
	 * @param {(...args: any[]) => any} callback
	 */
	function registerCommand(context, name, callback) {
		context.subscriptions.push(vscode.commands.registerCommand(name, callback));
	}
	/**
	 * @param {string} command
	 * @param {any} params
	 */
	function executeCommand(command, ...params) {
		return vscode.commands.executeCommand(command, ...params);
	}

	/**
	 * @param {vscode.ExtensionContext} context
	 * @param {string} name
	 * @param {vscode.WebviewViewProvider} provider
	 * @param {{ readonly webviewOptions?: { readonly retainContextWhenHidden?: boolean; }; }} [options]
	 */
	function registerWebViewProvider(context, name, provider, options) {
		context.subscriptions.push(vscode.window.registerWebviewViewProvider(name, provider, options));
	}

	/**
	 * @param {string} message
	 * @param {any[]} items
	 */
	function showInfoPopup(message, ...items) {
		return vscode.window.showInformationMessage(message, ...items);
	}

	/**
	 * @param {string} message
	 * @param {any[]} items
	 */
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


	/** @param {vscode.InputBoxOptions} options */
	function showInputBox(options) {
		return vscode.window.showInputBox(options);
	}

	function basePath() {
		return vscode.workspace.workspaceFolders[0].uri.fsPath;
	}
	/** @param {string} path */
	function absoluteURI(path) {
		return vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, path);
	}

	function isDark() {
		return [vscode.ColorThemeKind.Dark, vscode.ColorThemeKind.HighContrast].includes(vscode.window.activeColorTheme.kind);
	}

	async function gitExtension() {
		const ext = vscode.extensions.getExtension('vscode.git');
		const api = ext.isActive ? ext.exports : await ext.activate();

		return api.getAPI(1);
	}

	return {
		registerCommand,
		executeCommand,

		registerWebViewProvider,

		showInfoPopup,
		showWarningPopup,
		showErrorPopup,
		showInputBox,

		basePath,
		absoluteURI,
		isDark,

		gitExtension,
	}
})();
