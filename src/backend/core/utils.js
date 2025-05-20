const path = require('path');
const fs = require('fs');

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

function pathExists(absolutePath) {
	return fs.existsSync(absolutePath.fsPath);
}


module.exports = { getNonce, sameDir, pathExists };