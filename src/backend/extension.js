const vscode = require('vscode');
const VSC = require('./core/vsc');
const HomeViewProvider = require('./home-provider');

const GIT = require('./core/git')

/** @param {vscode.ExtensionContext} context */
async function activate(context) {
	const vsc = VSC(context);
	const git = GIT(vsc.workingDirectory());

	vsc.registerWebViewProvider('mingit-webview', new HomeViewProvider(context.extensionUri));

	vsc.registerCommand('mingit.commit', function () {

	});

	vsc.registerCommand('mingit.stage', function () {

	});
	vsc.registerCommand('mingit.unstage', function () {

	});
	vsc.registerCommand('mingit.stash', function () {

	});

	vsc.registerCommand('mingit.push', function () {

	});
	vsc.registerCommand('mingit.pull', async () => {
		git.pull()
			.then(() => vsc.showInfoPopup('pull... done'))
			.catch(reason => vsc.showErrorPopup(`pull failed ${reason.message.replace(/error:/g, '')}`));
	});
	vsc.registerCommand('mingit.fetch', function () {

	});

	vsc.registerCommand('mingit.config.author', function () {

	});
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
};
