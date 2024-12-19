# Visual Studio Code Git
A Simple Git Extension for VSCode

## Features
- one-click pull with `--rebase` as default
	- unclean repo is automatically cleaned by stashing, and applying the stash
- one-click push
	- two-click for `--force`
- add tags
- history with graph
- file log with `--follow` as default
- compare two commits
- edit message of any commit

### TODO
1. DONE - create icon
1. DONE - set up package json
1. DONE - test run the extension
1. UI
	1. DONE - figma design
	1. theming: https://code.visualstudio.com/api/extension-guides/webview#theming-webview-content (css vars)
	1. DONE - icons
1. use [simple-git](https://github.com/steveukx/git-js) to implement the commands (other than the graph)
	- get the native scm extension and wait for it to init to get the repo path, as well as the git binary path to init simple-git
		- api.ts + service.ts
1. add view toolbar buttons for the commands
1. add the webview for the history, including working tree changes - without the graph
	- commit row
	- branch selector dropdown for history
1. add the changes tree view
1. cheat sheet
	- git configuration
		```bash
		# list all
		git config -l
		# set email
		git config user.email "user@email.com"
		# set email globally
		git config --global user.email "user@email.com"
		# get email
		git config --get user.email
		```
	- modifying pushed commits
		```bash
		# start (-i)nteractive rebase
		git rebase -i <commit_hash>
		# an editor window will be shown, set the action to 'edit' for the commits you want to modify, save and close the window
		# then alternate between the below commands to modify the commit, and continue the rebase
		git commit --amend --author="Author Author <author@email.com>"
		git rebase --continue
		```

- figure out which commands to use!
	```bash
	git log --graph --all -z?? -n 100 HEAD~[x*n]
	```
- use `--pretty-print` to easily parse out the commits [here](https://www.nushell.sh/cookbook/parsing_git_log.html)
supposedly this looks good?
	```bash
	git log --graph --abbrev-commit --decorate --format=format:'%C(bold blue)%h%C(reset) - %C(bold cyan)%aD%C(reset) %C(bold green)(%ar)%C(reset)%C(bold yellow)%d%C(reset)%n''     %C(white)%s%C(reset) %C(dim white)- %an%C(reset)' --all
	```
- parse commits
- for the graph, we're supposed to have the segments, and the colors!

https://github.com/bendrucker/git-log-parser

https://github.com/mlange-42/git-graph

- use [VSC webview UI toolike](https://github.com/microsoft/vscode-webview-ui-toolkit)


# RECOMMENDED FORMAT?

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Working with Markdown

You can author your README using Visual Studio Code.  Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux)
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux)
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
