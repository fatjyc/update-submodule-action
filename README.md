# Update Submodule Action

Automatically update submodule

## Inputs

## `user`

**Required** The GitHub API user

## `token`

**Required** The GitHub API token

## `repo`

**Required** The Remote repo name

## `repo_owner`

**Required** The Remote Repo Owner


## Example usage

```
uses: fatjyc/update-submodule-action@v1.0
with:
  user: ${{ user }}
  token: ${{ secrets.GH_TOKEN }}
  repo_owner: ${{ repo_owner }}
  repo: ${{ repo }}
```