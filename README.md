# Visual Studio Code Git
A Simple Git Extension for VSCode

## Features
- 1st level commands
	- pull with `--rebase` as default
		- unclean repo is automatically cleaned by stashing, and applying the stash
	- push
	- push + `--force`
	- commit + `--amend`
- add/remove tags
- log + graph
- file log with `--follow`
- diff two commits
- edit commits
	- author
	- message

### TODO
- DONE - create extension icon
- DONE - set up package json
- DONE - test run the extension
- DONE - UI
	- DONE - figma design
	- DONE - icons
- DONE - create webview + add it to sidebar
- toolbar
	- DONE - add buttons
	- add button titles
	- hook up the buttons to vscode commands
		- webview communication
- log
	- commit component
		- message + author + date + hash
		- tags
		- files
	- graph
		- separate component or should just each commit go to its parent?
		- repaint on interaction toggling (expanding/collapsing) a commit
	- working tree
		- files
			- status
			- double click to diff
			- discard
			- stage?
			- multi-select with ctrl/shift
			- context menu?

- vscode APIs
	- posting messages from/to webview
	- webview set/get state
### GIT cheat sheet
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


# RECOMMENDED FORMAT?

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
