## 0.11.2
- Fixed a bug where the commit message was cleared if there were no selected files to commit (and none were staged)

## 0.11.1
- Improved the commit behavior to commit staged files if no changed files were selected
- Fixed a bug related to `diff`, `open-file` and `reveal-in-explorer` functions when the repo is in a parent directory of the workspace directory
- Fixed a bug where the commit message was cleared when no files were selected or the commit command fails

## 0.11.0
- Added `Open File` context menu command in Changes List.
- Added `Reveal File In Explorer` context menu command in Changes List.
- Added `File History` context menu command in Changes List.
- The empty file in the diff view is now readonly!

## 0.10.14
- Fixed a bug where file paths in the changes list could have quotes which would badly mess up the markup!

## 0.10.12
- Fixed a bug the `File History` didn't automatically trigger the filter

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