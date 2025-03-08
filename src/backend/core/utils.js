const path = require('path');

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function sameDir(dir, other) {
	return path.normalize(dir).toLowerCase() == path.normalize(other).toLowerCase();
}

module.exports = { getNonce, sameDir };