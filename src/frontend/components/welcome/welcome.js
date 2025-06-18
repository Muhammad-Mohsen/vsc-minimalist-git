import HTMLElementBase from "../../core/html-element-base.js";

class Welcome extends HTMLElementBase {

	connectedCallback() {
		this.#render();
	}

	#render() {
		this.innerHTML = /*html*/`
			<content>
				<p>In order to use Git features, you can open a folder containing a Git repository.</p>
				<button class="monaco-button monaco-text-button" onclick="${this.handle}.postMessage({ command: 'openfolder' })">Open Folder</button>

				<p>Alternatively, you can clone from a URL <span class="noworkspace">or initialize a repository</span> which will enable source control features powered by Git.</p>
				<button class="monaco-button monaco-text-button" onclick="${this.handle}.postMessage({ command: 'clone' })">Clone Repository</button>
				<button class="monaco-button monaco-text-button noworkspace" onclick="${this.handle}.postMessage({ command: 'initrepo' })">Initialize Repository</button>

				<p>To learn more about how to use Git and source control in VS Code <a class="monaco-link" href="https://aka.ms/vscode-scm">read the docs</a>.</p>
			</content>
		`;
	}
}

customElements.define('mingit-welcome', Welcome);
