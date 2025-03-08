#!/bin/bash

@REM Create and initialize repo-2
mkdir repo-2
cd repo-2
git init

@REM Create `main.txt`, write "main", and commit
touch main.txt
echo main > main.txt
git add .
git commit -m "Initial main.txt"

@REM Append "change on main" and commit
echo change on main >> main.txt
git add .
git commit -m "Added change on main"

@REM Create feature-1 branch
git checkout -b feature-1

@REM Create `feature-1.txt`, write "feature-1", append "no on feature-1" to `main.txt` and commit
touch feature-1.txt
echo feature-1 > feature-1.txt
echo now on feature-1 >> main.txt
git add .
git commit -m "Initial feature-1 change"

@REM Append "change on feature-1" and commit
echo "change on feature-1" >> feature-1.txt
git add .
git commit -m "Added change on feature-1 to feature-1.txt"

@REM checkout master and create feature-2 branch
git checkout master
git checkout -b feature-2

@REM Create `feature-2.txt`, write "feature-2", and commit
touch feature-2.txt
echo feature-2 > feature-2.txt
echo now on feature-2 >> main.txt
git add .
git commit -m "Initial feature-2 change"

@REM Create `feature-2s.txt`, write "feature-2", and stash
touch feature-2s.txt
echo feature-2s > feature-2s.txt
git add .
git stash save feature-2s.txt

@REM Rename feature-2.txt and commit
git mv feature-2.txt feature-2-rename.txt
git commit -m "Renamed feature-2.txt to feature-2-rename.txt"

@REM checkout master, create delete-me.txt, and commit
git checkout master
touch delete-me.txt
echo "delete me" > delete-me.txt
git add delete-me.txt
git commit -m "Added delete-me.txt"

@REM Create `main-2s.txt`, write "main-2", and stash
touch main-2s.txt
echo main-2s > main-2s.txt
git add .
git stash save main-2s.txt

@REM Create `main-3s.txt`, write "main-3", and stash
touch main-3s.txt
echo main-3s > main-3s.txt
git add .
git stash save main-3s.txt

@REM Create `feature-12.txt`, write "feature-12", and commit
git checkout feature-1
touch feature-12.txt
echo feature-12 > feature-12.txt
git commit -m "Added feature-12"

@REM Create `feature-22.txt`, write "feature-22", and commit
git checkout feature-2
touch feature-22.txt
echo feature-22 > feature-22.txt
git commit -m "Added feature-22"

@REM Delete delete-me.txt and commit
git checkout master
git rm delete-me.txt
git commit -m "Deleted delete-me.txt"

@REM merge feature-1 into master
git merge feature-1 --no-ff -m "Merge branch 'feature-1' into 'master`"

@REM Append "change on feature-1" and commit
git checkout feature-2
echo feature-2 change >> feature-2.txt
git commit -m "Changed feature-2"

echo "Repository test-repo created and populated."
git log --graph --decorate --oneline --all

cd ..