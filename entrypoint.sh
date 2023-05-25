#!/bin/sh -l

echo "Update git submodule"

git clone "https://${INPUT_USER}:${INPUT_TOKEN}@github.com/${INPUT_REPO_OWNER}/${INPUT_REPO}.git"
cd ${INPUT_REPO}

git checkout ${GITHUB_REF_NAME}

if [ $? != 0 ]
then
    echo "${GITHUB_REF_NAME} not exists"
    exit 1
fi

git config user.email ${INPUT_COMMITTOR_USERNAME}
git config user.name ${INPUT_COMMITTOR_EMAIL}

echo "Update ${INPUT_PATH}"

git submodule update --init --recursive

old_submodule_version=$(git submodule status "$INPUT_PATH" | awk '{print $1}')
echo "old version: ${old_submodule_version}"

git submodule update --remote --merge ${INPUT_PATH}

cd ${INPUT_PATH}
git checkout ${GITHUB_REF_NAME}
cd ..

new_submodule_version=$(git submodule status "$INPUT_PATH" | awk '{print $1}' | cut -c 2-)
echo "new version: ${new_submodule_version}"

cd ${INPUT_PATH}
commit_msg=$(git log --pretty=%B "$old_submodule_version..$new_submodule_version")
cd ..


echo "commit msg: ${commit_msg}"

repo=$(echo $GITHUB_REPOSITORY | sed 's/\//\\\//g')

if [[ "$commit_msg" == *"Merge pull request"* ]]; then
  PR=$(echo "$commit_msg" | grep -oE '[0-9]+' | head -n1)

  echo "https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls/${PR}"

  user=$(curl -L \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${INPUT_TOKEN}"\
    -H "X-GitHub-Api-Version: 2022-11-28" \
    https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls/${PR} | jq .merged_by.login | tr -d '"')

  new_commit_msg=$(echo "$commit_msg" | sed -E "s/Merge pull request #([0-9]+)/Merge PR $repo#\1 by @$user\n/g")
else
  new_commit_msg=$(echo "$commit_msg")
fi


echo "new commit msg: ${new_commit_msg}"

git add .
git commit -m "update ${INPUT_PATH}: ${new_commit_msg}"
git push "https://${INPUT_USER}:${INPUT_TOKEN}@github.com/${INPUT_REPO_OWNER}/${INPUT_REPO}.git" ${GITHUB_REF_NAME}
