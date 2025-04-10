const vscode = require('vscode');
const MainViewProvider = require('./main-view-provider');

const vsc = require('./core/vsc');
const git = require('./core/git');

/** @param {vscode.ExtensionContext} context */
async function activate(context) {
	const provider = new MainViewProvider(context);
	vsc.registerWebViewProvider(context, 'mingit-main-view',
		provider,
		{ webviewOptions: { retainContextWhenHidden: true }
	});

	// COMMANDS
	vsc.registerCommand(context, 'mingit.amendCommit', (context) => {
		provider.onContext({ command: 'amendcommit', body: context });
	});

	vsc.registerCommand(context, 'mingit.stage', () => {

	});
	vsc.registerCommand(context, 'mingit.unstage', () => {

	});
	vsc.registerCommand(context, 'mingit.stash', () => {

	});

	vsc.registerCommand(context, 'mingit.push', () => {

	});
	vsc.registerCommand(context, 'mingit.pull', async () => {
		git.pull()
			.then(() => vsc.showInfoPopup('pull... done'))
			.catch(reason => vsc.showErrorPopup(`pull failed ${reason.message.replace(/error:/g, '')}`));
	});
	vsc.registerCommand(context, 'mingit.fetch', () => {

	});

	vsc.registerCommand(context, 'mingit.forcePush', (context) => {
		provider.onContext({ command: 'forcepush', body: context });
	});
	vsc.registerCommand(context, 'mingit.checkoutCommit', (context) => {
		provider.onContext({ command: 'checkoutcommit', body: context });
	});
	vsc.registerCommand(context, 'mingit.cherryPickCommit', (context) => {
		provider.onContext({ command: 'cherrypickcommit', body: context });
	});
	vsc.registerCommand(context, 'mingit.revertCommit', (context) => {
		provider.onContext({ command: 'revertcommit', body: context });
	});

	vsc.registerCommand(context, 'mingit.continueRebase', (context) => {
		provider.onContext({ command: 'continuerebase', body: context });
	});
	vsc.registerCommand(context, 'mingit.abortRebase', (context) => {
		provider.onContext({ command: 'abortrebase', body: context });
	});
	vsc.registerCommand(context, 'mingit.continueMerge', (context) => {
		provider.onContext({ command: 'continuemerge', body: context });
	});
	vsc.registerCommand(context, 'mingit.abortMerge', (context) => {
		provider.onContext({ command: 'abortmerge', body: context });
	});
	vsc.registerCommand(context, 'mingit.continueCherryPick', (context) => {
		provider.onContext({ command: 'continuecherrypick', body: context });
	});
	vsc.registerCommand(context, 'mingit.abortCherryPick', (context) => {
		provider.onContext({ command: 'abortcherrypick', body: context });
	});
	vsc.registerCommand(context, 'mingit.interactiveRebase', (context) => {
		provider.onContext({ command: 'interactiverebase', body: context });
	});
	vsc.registerCommand(context, 'mingit.mergeCommitIntoCurrent', (context) => {
		provider.onContext({ command: 'mergecommitintocurrent', body: context });
	});
	vsc.registerCommand(context, 'mingit.resetBranchToCommit', (context) => {
		provider.onContext({ command: 'resetbranchtocommit', body: context });
	});

	vsc.registerCommand(context, 'mingit.addTag', (context) => {
		provider.onContext({ command: 'addtag', body: context });
	});
	vsc.registerCommand(context, 'mingit.deleteTag', (context) => {
		provider.onContext({ command: 'deletetag', body: context });
	});

	vsc.registerCommand(context, 'mingit.copyHash', (context) => {
		provider.onContext({ command: 'copyhash', body: context });
	});
	vsc.registerCommand(context, 'mingit.copyMessage', (context) => {
		provider.onContext({ command: 'copymessage', body: context });
	});

	vsc.registerCommand(context, 'mingit.applyStash', (context) => {
		provider.onContext({ command: 'applystash', body: context });
	});
	vsc.registerCommand(context, 'mingit.dropStash', (context) => {
		provider.onContext({ command: 'dropstash', body: context });
	});

	vsc.registerCommand(context, 'mingit.renameBranch', async (context) => {
		provider.onContext({ command: 'renamebranch', body: context });
	});
	vsc.registerCommand(context, 'mingit.changeAuthor', async () => {
		provider.onContext({ command: 'changeauthor', body: context });
	});

	vsc.registerCommand(context, 'mingit.refresh', (context) => {
		provider.onContext({ command: 'refresh', body: context });
	});
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
};
