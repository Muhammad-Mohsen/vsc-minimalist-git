# Minimalist Git

## Publishing / Updating
- install `vsce` package `--global` if not installed already.
- run `vsce login muhammadmohsen` and enter the access token.
- run `vsce package`
- run `vsce publish major/minor/patch/`

## Code
The code is split in two main layers:
- backend: accesses vscode APIs and git (using `simple-git`). The only "UI" in this page is the `main-view-provider` which is the sidebar provider
- frontend: the webview basically

### Backend
TODO
### Frontend
TODO

## Testing
The `tests` folder contains a few bash scripts which create local repositories in different states to test the behavior of the extension.

I also compared the extension's behavior against the built-in git extension in VSCode and the OG, the 🐐, `Git Graph` extension.

## TODO
- DONE - context menu in changes-list
	- file history
	- open in explorer (not deleted)
	- open file (not deleted)
	- care for renamed files
- keep commit message if no files were selected
- DONE - restart on folder selection
- DONE - fix bug if repo is initialized but has no HEAD (no commits)
- DONE - remove simplegit
	- DONE - status (pfff)
	- DONE - addConfig
	- DONE - show
	- DONE - diff
	- DONE - version
	- DONE - checkIsRepo
	- DONE - rev-parse
	- DONE - catFile

- DONE - use https://github.com/hellopao/vscode-seti-icons/tree/master for file icons?
- DONE - fix discarding a mix of tracked and untracked files (this is gonna be a bit of a bitch!!...not really!)
- DONE - fix watcher debounce logic because it ignores some stuff (for example, when committing, it runs after the git add, but ignores git commit)
- DONE - add refresh button (because I removed the onvisibilitychange handler...didn't like the way it always reset to the working tree, and the extension seemed to work fine even if it isn't visible)!

DONE - this is what I got when in not at the root of the repo
	d:\Code\personal\muhammad-mohsen.github.io\buku-bacaan-koptik\buku-bacaan-koptik\web\assets\documents\pascha\resurrection\Prophecies.cr.xml

	this is what it should be
	D:\Code\personal\muhammad-mohsen.github.io\buku-bacaan-koptik\web\assets\documents\pascha\resurrection\Prophecies.cr.xml

- FIXED - it doesn't work :D :D
	- stop relying on the built-in git, and use file watchers instead
- DONE - fix commands that may not actully change the folder (for example fetch that fetches nothing)...stop the progressbar

- add commands to abort cherry-pick, abort merge, abort/continue rebase?
	- DONE - create 2 * 3 commands to continue, abort sequence op
	- DONE - show commands based on current state
	- DONE - refactor the state code to use regex
	- DONE - fix repo-2 merge conflict status
- plus
	- DONE - revert commit
	- DONE - interactive rebase
	- DONE - merge into current branch
	- DONE - reset branch to this commit
	- DONE - change author

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

- repo state detection
	- DONE - changes
	- rebasing
	- detached
	- cherry picking

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
			- DONE - rename branch
	- commits (context menu)
		- DONE - add tag
		- DONE - delete tag

		- DONE - checkout
		- DONE - cherry-pick
		- revert
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
- DONE - shift-selections

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

## GIT cheat sheet
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
