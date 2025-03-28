#!/bin/bash

# Create a temporary directory for the repository
mkdir cherry-pick-conflict
cd cherry-pick-conflict
git init

# Initialize a Git repository
git init

# Create initial files and commit
echo "Initial content" > file1.txt
git add file1.txt
git commit -m "Initial commit"

# Create branch 'feature1'
git checkout -b feature1
echo "Feature 1 changes" > file2.txt
git add file2.txt
git commit -m "Add feature 1"

# Create branch 'feature2'
git checkout main
git checkout -b feature2
echo "Feature 2 changes" > file3.txt
git add file3.txt
git commit -m "Add feature 2"

# Modify file1 in feature 1 to create conflict
git checkout feature1
echo "Conflicting change in feature 1" >> file1.txt
git add file1.txt
git commit -m "Conflicting change in feature 1"
COMMIT_ID=$(git log --format="%H" -n 1) # get the last commit id.

# Modify file1 in feature 2 to create conflict
git checkout feature2
echo "Conflicting change in feature 2" >> file1.txt
git add file1.txt
git commit -m "Conflicting change in feature 2"

# Attempt to cherry-pick the conflicting commit from feature1 into feature2, causing a conflict
git cherry-pick $COMMIT_ID

# The cherry-pick should now be stuck due to a conflict.
echo "Cherry-pick is stuck in conflict. Repository located at: $TMP_REPO"
echo "You can now use this repository for testing your VS Code Git extension."

# To clean up the temporary repository after testing, you can uncomment the following line:
# rm -rf "$TMP_REPO"