## 0.10.11
- Fixed a bug where resolving diff URIs failed when renamed/deleted files are staged.

## 0.10.10
- Added filter by file in graph search.
- Added `File History` entry in explorer context menu.

## 0.10.9
- Added `init repository` option in the welcome page.
- Fixed a bug where some error messages weren't properly surfaced to the user.

## 0.10.8
- Updated seti file icon font

## 0.10.7
- Fixed a bug where the 'welcome' page check threw!

## 0.10.6
- Fixed a bug where commit message tooltip wasn't HTML-encoded so it could break EVERYTHING!!

## 0.10.5
- Fixed bug where `discard` wasn't working

## 0.10.4
- Fixed bug where untagged commits still registered as having an 'undefined' tag!
- Fixed `commit --amend` command without any files.

## 0.10.3
- Fixed bug where the `status` command didn't list individual files under 'untracked directories'.

## 0.10.2
- Fixed bug where the incorrect `stash` command was used.

## 0.10.1
- Fixed an internal exception.
- Fixed add tag command not working.
- Removed unnecessary renders on repo change.

## 0.10.0
- Removed `simple-git` dependency.

## 0.9.13
- Fixed `commit --amend` command with multiple files.

## 0.9.12
- Updated scrollbar + resizer styling.
- Added `DIFF` to diff editor tab title.

## 0.9.11
- Fixed log filtering.

## 0.9.10
- Added resizing commit messagebox.
- Added `Enter-to-commit` functionality.
- Fixed discarding of renamed files.

## 0.9.9
- Added Seti icons in change list.
- Fixed oneshot-discarding of tracked + untracked files.
- Fixed repo change detection issue where the final change event in commands that execute multiple git operations was ignored.

## 0.9.8
- Actually fixed `push` & `push --force` commands :D
- Fixed the manual `refresh` command!
- Fixed repo change detection when the working directory is a subdirectory of the repo directory.

## 0.9.7
- Fixed `push` command!
- Fixed incorrect diff URIs when the working directory is a subdirectory of the repo directory.
- Added manual `refresh` command to the overflow menu

## 0.9.6
- Fixed `push --force` command.
- Tweaked extension icon.
- Excluded `screenshots` and `tests` folders from package.

## 0.9.4
- Initial beta release.