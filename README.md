# Visual Studio Code Git
View a Git Graph of your repository, and easily perform Git actions from the graph.
(screenshot)

## Features
- Commit log with graph for all branches (includes working tree + stashes)
- Filter log by:
	- author
	- message (--grep)
	- date (--before, --after)
- Diff two commits
- Add/Delete tags
- Save/Drop/View stashes
- Git Commands
	- fetch
	- pull --rebase/pull --rebase --autostash
	- push/push --force
	- commit/commit --amend
	- commit & push
	- stage/unstage
	- stash
	- revert
	- push
	- push + `--force`
	- commit + `--amend`

Visual Studio Marketplace
This extension is available on the Visual Studio Marketplace for Visual Studio Code.

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
	- DONE - clean raw message from graph edges
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

- DONE - changes
	- DONE - working tree changes
		- DONE - dispatch load event
		- NOT NEEDED - parse `git status`
		- DONE - render file
			- DONE - uri
			- DONE - decorator
		- DONE - selection
	- DONE - onclick show diff
	- DONE - commit message input + inline commit button

- DONE - stashes
	- DONE - list the stashes
		- group stashes by parent
		- splice them into the commits array
	- DONE - assign them a new lane maxBranchIndex + 1 & sort them by parent
	- DONE - simply render them!

- commands
	- toolbar
		- DONE - fetch
		- DONE - pull
		- DONE - push/--force (context)
		- DONE - commit/ --amend (context) (context)
		- DONE - stash
		- DONE - stage
		- DONE - unstage
		- DONE - discard -> show confirmation message
		- overflow
			- toggle `--rebase`
			- toggle `--autostash`
			- change author
			- rename branch
			- reset -> show a quick select --soft, --hard, HEAD, origin -> show confirmation
	- commits (context menu)
		- DONE - add tag
		- DONE - delete tag

		- DONE - checkout
		- cherrypick
		- revert -> show confirmation message
		- drop -> show confirmation message

		- merge into current branch
		- rebase current branch on this commit
		- reset current branch to this commit

		- DONE - copy hash
		- DONE - copy message

		- DONE - apply stash (for stashes)
		- DONE - drop stash (for stashes) -> show confirmation message

- DONE - render staged files differently
- DONE - conflicts
	- DONE - render conflicted decoration
	- DONE - open merge editor

- DONE - resolve renamed files -> relocate the file (move it under a secondary folder, then move it back)
- DONE - fastlane

- DONE - repo detections
	- DONE - 'welcome' screen
		- DONE - html
		- DONE - no git!!
		- DONE - no workspace/repository
	- DONE - repository in parent...automatically opened!
		- DONE - show a notification message
	- DONE - changes
- DONE - visibility change
- DONE - loading bar
	- show on postMessage
	- hide on onMessage

### Optimizations
- draw graph in an `async` function?
- DONE - cache vertex/edge bounds
- datasource entries
	- commit data
	- vertex/edge bounds (invalidated on repo change)
- paging
	- chunk the drawing
	- use an `orphanage` map to keep track of commits whose parents are unreachable
		- key: hash (or parent hash?)
		- value: data source entry
	- on new page
		- add to the datasource
		- redraw
		- check the `orphanage` and see if anything is now reachable & re-render

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


## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues
- Currently, the graph displays the most recent 500 commits

## Release Notes

### 1.0.0
Initial release

## Publishing / Updating
- run `vsce login muhammadmohsen` and enter the access token.
- run `vsce package`
- run `vsce publish major/minor/patch/`