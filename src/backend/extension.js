const vscode = require('vscode');
const VSC = require('./core/vsc');
const HomeViewProvider = require('./home-provider');

const GIT = require('./core/git');

/** @param {vscode.ExtensionContext} context */
async function activate(context) {
	const vsc = VSC(context);
	const git = GIT(vsc.workingDirectory());

	vsc.registerWebViewProvider('mingit-webview', new HomeViewProvider(context.extensionUri));

	vsc.registerCommand('mingit.commit', () => {

	});

	vsc.registerCommand('mingit.stage', () => {

	});
	vsc.registerCommand('mingit.unstage', () => {

	});
	vsc.registerCommand('mingit.stash', () => {

	});

	vsc.registerCommand('mingit.push', () => {

	});
	vsc.registerCommand('mingit.pull', async () => {
		git.pull()
			.then(() => vsc.showInfoPopup('pull... done'))
			.catch(reason => vsc.showErrorPopup(`pull failed ${reason.message.replace(/error:/g, '')}`));
	});
	vsc.registerCommand('mingit.fetch', () => {

	});

	vsc.registerCommand('mingit.config.author', () => {

	});
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
};
