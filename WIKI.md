# Dev Notes

This wiki provides detailed information about the MinGit Visual Studio Code extension, its features, and how to use them effectively.

## Overview

MinGit is a minimalist Git client for Visual Studio Code. It provides an interactive log graph, a clear view of the working tree, commit diffs, and a host of integrated Git commands accessible directly from its UI. It aims to be a successor to the popular `Git Graph` extension, focusing on a clean interface and essential features.

## Core Features

-   **Interactive Log Graph**: View the commit history for all branches, including the working tree and stashes, in a clear graphical format.
-   **Powerful Filtering**: The log can be filtered by author, message content (`--grep`), date (`--before`, `--after`), and file path. Filters are stackable for precise history navigation.
-   **Diff Viewing**: Easily compare any two commits or view changes in the working tree.
-   **Integrated Git Operations**: Perform common Git tasks like commit, stage, unstage, discard, fetch, pull, push, and manage stashes and tags without leaving the extension's view.
-   **Conflict Resolution**: During a rebase, merge, or cherry-pick, the extension provides options to continue, skip, or abort the process.

## Usage

### Main View

The extension's main view is divided into three parts:
1.  **Toolbar**: Quick access to common Git commands.
2.  **Commit List**: The interactive log graph showing commit history.
3.  **Change List**: Shows the current working tree, staged files, and file-level diffs for a selected commit.

### Toolbar Commands

-   **Fetch**: Fetches from the remote.
-   **Pull**: Pulls changes, with a default strategy of `--rebase --autostash`.
-   **Push**: Pushes committed changes. The overflow menu contains **Push --force**.
-   **Commit**: Commits selected files from the Changes List. The overflow menu contains **Amend Last Commit**.
-   **Stage / Unstage**: Stages or unstages selected files.
-   **Discard**: Discards changes to selected files.
-   **Stash**: Stashes current changes.

### Log View (Context Menus)

Right-clicking on a commit, branch, or stash in the log view reveals a context menu with powerful actions.

**On a Commit:**
-   `Checkout commit`
-   `Cherrypick commit`
-   `Revert commit`
-   `Merge commit into current branch`
-   `Reset branch to this commit (hard)`
-   `Start interactive rebase from commit`
-   `Copy commit hash` / `Copy commit message`
-   `Add tag` / `Delete tag`

**On a Stash:**
-   `Apply stash`
-   `Drop stash`

**During a Sequencer Operation (Rebase/Merge/Cherry-Pick):**
-   `Continue rebase` / `Abort rebase`
-   `Continue merge` / `Abort merge`
-   `Continue Cherry-Pick` / `Abort Cherry-Pick`

### Changes List (Context Menus)

Right-clicking a file in the changes list provides file-specific actions:
-   `File History`
-   `Open File`
-   `Reveal In Explorer`

## Architecture

The extension's codebase is divided into two primary layers:

-   **Backend (`src/backend`)**: This is the Node.js environment that interfaces with Visual Studio Code APIs and the file system. It executes all Git commands and provides the data to the frontend. The `extension.js` is the main activation point, and `main-view-provider.js` is responsible for managing the webview panel.
-   **Frontend (`src/frontend`)**: This is a standard HTML/CSS/JavaScript webview that renders the UI. It communicates with the backend to send user commands (e.g., "commit") and receive data to display (e.g., the log graph and file status).

## Testing

The `tests` folder contains several shell scripts (`.sh`). These scripts are used to create local Git repositories in various states (e.g., with merge conflicts, complex histories) to manually test the extension's behavior under different scenarios. The behavior is often compared against VS Code's built-in Git extension and the original `Git Graph` extension to ensure correctness and consistency.

## Publishing / Updating
- install `vsce` package `--global` if not installed already.
- run `vsce login muhammadmohsen` and enter the access token.
- run `vsce package`
- run `vsce publish major/minor/patch/`

## Optimizations
- draw graph in an `async` function?
- DONE - cache vertex/edge bounds
- datasource entries
	- commit data
	- vertex/edge bounds (invalidated on repo change)
- use `css containment` to optimize rendering
	- separate the graph from the `commit` element
	- set `intrinsic-height`
- paging
	- chunk the drawing
	- use an `orphanage` map to keep track of commits whose parents are unreachable
		- key: hash (or parent hash?)
		- value: data source entry
	- on new page
		- add to the datasource
		- redraw
		- check the `orphanage` and see if anything is now reachable & re-render

## TODO
- DONE - after initializing a repository, the extension view is blank
- add `publish branch` command to the overflow button
- add `git gc --aggressive` command to the overflow button

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
