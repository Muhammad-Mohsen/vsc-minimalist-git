#!/bin/bash

# Create a temporary directory for the repository
mkdir rebase-conflict
cd rebase-conflict
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

# Modify file1 in feature 2 to create conflict
git checkout feature2
echo "Conflicting change in feature 2" >> file1.txt
git add file1.txt
git commit -m "Conflicting change in feature 2"

# Attempt to rebase feature2 onto feature1, causing a conflict
git checkout feature2
git rebase feature1

# The rebase should now be stuck due to a conflict.
echo "Rebase is stuck in conflict. Repository located at: $TMP_REPO"
echo "You can now use this repository for testing your VS Code Git extension."

