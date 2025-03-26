# Minimalist Git
View a Git Graph of your repository, and easily perform Git actions from the graph.

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
- Git Commands
	- fetch
	- pull `--rebase --autostash` by default
	- push + push `--force`
	- commit + commit `--amend`
	- stage + unstage
	- stashes: list + apply + drop
	- discard

![Screenshot #1](res/screenshots/mingit-screenshot-2.PNG)
<sub>theme: [VSCode Minimalist Theme (Oak)](https://marketplace.visualstudio.com/items?itemName=MuhammadMohsen.vsc-minimalist-theme)</sub>

## Visual Studio Marketplace
This extension is available on the Visual Studio Marketplace for Visual Studio Code.

## Known Issues
- The graph only displays the most recent 500 commits.
- No localization support.

## Release Notes

### 1.0.0
Initial release
