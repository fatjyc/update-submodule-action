#!/bin/sh -l

echo "Update git submodule"

git clone "https://${INPUT_USER}:${INPUT_TOKEN}@github.com/${INPUT_REPO_OWNER}/${INPUT_REPO}.git"
cd ${INPUT_REPO}

git config user.email ${INPUT_USER}
git config user.name ${INPUT_USER}

git submodule update --init --recursive
git submodule update --remote --remote

git add .
git commit -m "update ${GITHUB_REPOSITORY} submodule"
git push "https://${INPUT_USER}:${INPUT_TOKEN}@github.com/${INPUT_REPO_OWNER}/${INPUT_REPO}.git" main