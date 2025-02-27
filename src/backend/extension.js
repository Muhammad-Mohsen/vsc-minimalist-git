const vscode = require('vscode');
const MainViewProvider = require('./main-view-provider');

const vsc = require('./core/vsc');
const git = require('./core/git');

/** @param {vscode.ExtensionContext} context */
async function activate(context) {
	git.setWorkingDirectory(vsc.workingDirectory());

	vsc.registerWebViewProvider(context, 'mingit-main-view',
		new MainViewProvider(context.extensionUri),
		{ webviewOptions: { retainContextWhenHidden: true }
	});

	vsc.registerCommand(context, 'mingit.commit', () => {

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

	vsc.registerCommand(context, 'mingit.config.author', async () => {
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

		try {
			const author = await vsc.showInputBox({
				placeHolder: 'user <email>',
				validateInput: validateInput
			});

			const { user, email } = tokenizeInput(author);

			git.setConfig('user.name', user)
			git.setConfig('user.email', email);

		} catch {}
	});
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
};
