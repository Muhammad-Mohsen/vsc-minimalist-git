# Minimalist Git
Interactive log graph, working tree & commit diffs, and integrated git commands.
<br>
Follow up to the goated `Git Graph` extension.

## Features
- Commit log with graph for all branches (includes working tree + stashes)
- Filter log by:
	- author
	- message (--grep)
	- date (--before, --after)
- stackable filters: can simply type `grep: test commit author: john doe before: 5 apr 2025` in the searchbox
- Diff two commits
- Add/Delete tags
- Save/Drop/View stashes
- continue/skip/abort rebase/cherry-pick/merge
- Cookie-cutter commands:
	- fetch
	- pull `--rebase --autostash`
	- push + push `--force`
	- commit + commit `--amend`
	- stage + unstage
	- discard
- Commit commands
	- revert/checkout/cherry-pick commit
	- merge to current branch
	- reset to commit `--hard`
- Change repository author

![Screenshot #1](res/screenshots/mingit-screenshot-1.PNG)

![Screenshot #2](res/screenshots/mingit-screenshot-2.PNG)
<sub>theme: [VSCode Minimalist Theme (Oak)](https://marketplace.visualstudio.com/items?itemName=MuhammadMohsen.vsc-minimalist-theme)</sub>

## Visual Studio Marketplace
This extension is available on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=MuhammadMohsen.mingit) for Visual Studio Code.

## Known Issues
- The graph only displays the most recent 500 commits.
- No localization support.

## Release Notes

### 0.9.4
- Initial beta release.

### 0.9.6
- Fixed `push --force` command.
- Tweaked extension icon.
- Excluded `screenshots` and `tests` folders from package.

### 0.9.7
- Fixed `push` command!
- Fixed incorrect diff URIs when the working directory is a subdirectory of the repo directory.
- Added manual `refresh` command to the overflow menu

### 0.9.8
- Actually fixed `push` & `push --force` commands :D
- Fixed the manual `refresh` command!
- Fixed repo change detection when the working directory is a subdirectory of the repo directory.

### 0.9.9
- Added Seti icons in change list.
- Fixed oneshot-discarding of tracked + untracked files.
- Fixed repo change detection issue where the final change event in commands that execute multiple git operations was ignored.

### 0.9.10
- Added resizing commit messagebox.
- Added `Enter-to-commit` functionality.
- Fixed discarding of renamed files.

## 0.9.11
- Fixed log filtering.

## 0.9.12
- Updated scrollbar + resizer styling.
- Added `DIFF` to diff editor tab title.

## 0.9.13
- Fixed `commit --amend` command with multiple files.

## 0.10.0
- Removed `simple-git` dependency.

## 0.10.1
- Fixed an internal exception.
- Fixed add tag command not working.
- Removed unnecessary renders on repo change.

## 0.10.2
- Fixed a bug where the incorrect `stash` command was used.

## 0.10.3
- Fixed a bug where the `status` command didn't list individual files under 'untracked directories'.

## 0.10.4
- Fixed a bug where untagged commits still registered as having an 'undefined' tag!
- Fixed `commit --amend` command without any files.

## 0.10.5
- Fixed a bug where `discard` wasn't working

## 0.10.6
- Fixed a bug where commit message tooltip wasn't HTML-encoded so it could break EVERYTHING!!