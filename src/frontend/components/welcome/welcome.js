import HTMLElementBase from "../../core/html-element-base.js";

class Welcome extends HTMLElementBase {
	#commitInput;
	#commitButton;

	connectedCallback() {
		this.#render();
	}

	#render() {
		this.innerHTML = /*html*/`
			<content>
				<p>In order to use Git features, you can open a folder containing a Git repository or clone from a URL.</p>
				<button class="monaco-button monaco-text-button">Open Folder</button>
				<button class="monaco-button monaco-text-button">Clone Repository</button>
				<p>To learn more about how to use Git and source control in VS Code <a class="monaco-link" href="https://aka.ms/vscode-scm">read the docs</a>.</p>
			</content>
		`;
	}
}

customElements.define('mingit-welcome', Welcome);
