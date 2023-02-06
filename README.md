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

## `committor_username`

**Required** Commitor Username

## `committor_email`

**Required** Commitor Email

## `path`

**Required** Submodule path

## `sync_ref`

**Required** Sync Ref name

## Example usage

```
uses: fatjyc/update-submodule-action@v1.0
with:
  user: ${{ user }}
  token: ${{ secrets.GH_TOKEN }}
  repo_owner: ${{ repo_owner }}
  repo: ${{ repo }}
  committor_username: xxx
  committor_email: xxx@xx.com
  path: repo_name
  sync_ref: main
```