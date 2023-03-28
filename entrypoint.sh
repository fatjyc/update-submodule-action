#!/bin/sh -l

echo "Update git submodule"

git clone "https://${INPUT_USER}:${INPUT_TOKEN}@github.com/${INPUT_REPO_OWNER}/${INPUT_REPO}.git"
cd ${INPUT_REPO}

git checkout ${INPUT_SYNC_REF}

if [ $? != 0 ]
then
    echo "${INPUT_SYNC_REF} not exists"
    exit 1
fi

git config user.email ${INPUT_COMMITTOR_USERNAME}
git config user.name ${INPUT_COMMITTOR_EMAIL}

echo "Update ${INPUT_PATH}"


old_submodule_version=$(git submodule status "$INPUT_PATH" | awk '{print $1}' | cut -c 2-)


git submodule update --init --recursive
git submodule update --remote --merge ${INPUT_PATH}

new_submodule_version=$(git submodule status "$INPUT_PATH" | awk '{print $1}' | cut -c 2-)

commit_msg=$(git log --pretty=%B "$old_submodule_version..$new_submodule_version")

cd ${INPUT_PATH}
git checkout ${INPUT_SYNC_REF}
cd ..

git add .
git commit -m "Update ${INPUT_PATH}: ${commit_msg}"
git push "https://${INPUT_USER}:${INPUT_TOKEN}@github.com/${INPUT_REPO_OWNER}/${INPUT_REPO}.git" ${INPUT_SYNC_REF}