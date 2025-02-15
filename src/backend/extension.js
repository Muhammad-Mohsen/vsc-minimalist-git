const vscode = require('vscode');
const LogViewProvider = require('./log-provider');

const VSC = require('./core/vsc');
const GIT = require('./core/git');

/** @param {vscode.ExtensionContext} context */
async function activate(context) {
	GIT.setWorkingDirectory(VSC.workingDirectory());

	VSC.registerWebViewProvider(context, 'mingit-log-view', new LogViewProvider(context.extensionUri));

	VSC.registerCommand(context, 'mingit.commit', () => {

	});

	VSC.registerCommand(context, 'mingit.stage', () => {

	});
	VSC.registerCommand(context, 'mingit.unstage', () => {

	});
	VSC.registerCommand(context, 'mingit.stash', () => {

	});

	VSC.registerCommand(context, 'mingit.push', () => {

	});
	VSC.registerCommand(context, 'mingit.pull', async () => {
		GIT.pull()
			.then(() => VSC.showInfoPopup('pull... done'))
			.catch(reason => VSC.showErrorPopup(`pull failed ${reason.message.replace(/error:/g, '')}`));
	});
	VSC.registerCommand(context, 'mingit.fetch', () => {

	});

	VSC.registerCommand(context, 'mingit.config.author', async () => {
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
			const author = await VSC.showInputBox({
				placeHolder: 'user <email>',
				validateInput: validateInput
			});

			const { user, email } = tokenizeInput(author);

			GIT.setConfig('user.name', user)
			GIT.setConfig('user.email', email);

		} catch {}
	});
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
};
