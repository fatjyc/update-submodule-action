#!/bin/sh -l

echo "Update git submodule"

git clone "https://${INPUT_USER}:${INPUT_TOKEN}@github.com/${INPUT_REPO_OWNER}/${INPUT_REPO}.git"
cd ${INPUT_REPO}

git config user.email ${INPUT_COMMITTOR_USERNAME}
git config user.name ${INPUT_COMMITTOR_EMAIL}

echo "Update ${INPUT_PATH}"

git submodule update --init --recursive
git submodule update --remote --merge ${INPUT_PATH}

git add .
git commit -m "update ${GITHUB_REPOSITORY} submodule"
git push "https://${INPUT_USER}:${INPUT_TOKEN}@github.com/${INPUT_REPO_OWNER}/${INPUT_REPO}.git" ${INPUT_TARGET_BRANCH}