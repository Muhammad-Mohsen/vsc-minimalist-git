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
	- DONE - design
	- DONE - icons
- DONE - create webview + add it to sidebar

- DONE - toolbar
	- DONE - add buttons
	- DONE - add button titles
	- DONE - hook up the buttons to vscode commands
		- DONE - webview communication

- DONE - log
	- DONE - parse command output
	- DONE - render message, date, author
	- DONE - clean message from graph edges stuck to it
	- DONE - decorators
		- DONE - branch
		- DONE - tag
		- DONE - origin
		- DONE - head
	- DONE - graph

	- DONE - resolving branches
		- DOESN'T WORK - walk down the commit list, and assign each commit with its branch
			- then if a commit belongs to multiple branches (is the parent to multiple commits)
				- use `git branch --contains <commit-hash>` and use the branch listed at the end!! this won't work...the commit will belong to both branches :)
		- DONE - or...or use the `--graph` flag and check where the bloody commit asterisk is!!!
			- DONE - reserve space for commit marker based on index
			- DONE - move edges to be under the cell element
				- DONE - make the marker smaller
				- DONE - 'edge bend' resolution
					- DONE - color: if multiple parents, take the color of the parent
					- DONE - direction: if multiple parents + -ve direction + hits other markers, flip it!!

	- DONE - search
	- DONE - selection + multi-selection
	- onclick: show diff
	- DONE - working tree
		- DONE - 4 moving parts here
			- log + status+ status update + log update/filter
			- easy solution here is to just combine the log + status calls into a single response then render everything when we get the response

		- DONE - get the `branchIndex` of the head of the current branch (in the `status` response) and use it as the index for the `working tree` entry
		- DONE - onclick: show status

- changes
	- DONE - working tree changes
		- DONE - dispatch load event
		- NOT NEEDED - parse `git status`
		- DONE - render file
			- DONE - uri
			- DONE - decorator
		- DONE - selection
	- DONE - onclick show diff
	- DONE - commit message input + inline commit button

- commands (overflow menus)
	- toolbar
		- DONE - fetch
		- overflow
			- toggle `--rebase`
			- toggle `--autostash`
			- change author
			- force push
	- commits (context menu)
		- add tag
		- checkout
		- cherry pick
		- merge
		- ...
	- files (context menu)
		- stage/unstage selected
		- discard selected

- repo detections
	- 'welcome' screen
		- DONE - html
		- no git!!
		- no workspace/repository
	- repository in parent
	- changes
- DONE - visibility change

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

	- automatic `git add .`
		```bash
		git commit -am # automatic git add .
		```

	- auto stash
		```bash
		git pull --rebase --autostash
		```

	- amend
		```bash
		git add .
		git commit --amend -m "new msg"
		# or
		git commit --amend --no-edit # keep same message
		```

	- stash
		```bash
		git stash save name
		git stash list # list stashes
		git stash apply index_in_list
		```

	- rename branch
		```bash
		git branch -M # short for --move --force or -m -f
		```

	- reset
		```bash
		git reset --hard origin/branch_name
		git clean -df
		```

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
