import * as github from "@actions/github";
import * as exec from "@actions/exec";
import * as core from "@actions/core";
import * as io from "@actions/io";
import { getInputs } from "./context";
import path from "path";
import os from "os";

const MERGE_REGEX = /Merge pull request #(\d+) from (.*)/;

const getPRInfo = async (octokit: ReturnType<typeof github.getOctokit>, pr: number) => {
    const { data: pullRequest } = await octokit.rest.pulls.get({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: pr,
    });
    return pullRequest;
};

type Commit = {
    sha: string;
    commit: {
        message: string;
    };
    author: {
        login: string;
    };
};

const toTitle = (message: string) => {
    const lines = message.split("\n");
    const title = lines[0];
    // message double quotes will break the commit message, so we need to escape them
    return title.replace(/"/g, '\\"');
};

const getMessage = async (octokit: ReturnType<typeof github.getOctokit>, commit: Commit) => {
    if (commit.commit.message.match(MERGE_REGEX)) {
        const matches = commit.commit.message.match(MERGE_REGEX);

        const pr = matches?.[1];
        if (pr) {
            const prInfo = await getPRInfo(octokit, Number(pr));
            return `* ${commit.sha.slice(0, 7)} PR ${prInfo.head?.repo?.full_name}#${pr} ${toTitle(
                prInfo.title
            )} - @${commit.author?.login}`;
        }
    }
    return `* ${commit.sha.slice(0, 7)} ${toTitle(commit.commit.message)} - @${
        commit.author?.login
    }`;
};

async function run() {
    // core.info("Update git submodule");
    const input = getInputs();
    const repoUrl = `https://${input.user}:${input.token}@github.com/${input.repo_owner}/${input.repo}.git`;
    const repoDir = path.join(os.tmpdir(), "repo");
    await io.mkdirP(repoDir);
    await exec.exec(`git clone ${repoUrl} ${repoDir}`);

    core.info(`Update submodule ${input.path}`);

    const submoduleInfo = await exec.getExecOutput(`git submodule status ${input.path}`, [], {
        cwd: repoDir,
    });

    const originCommit = submoduleInfo.stdout.split(" ")[0].slice(1);
    console.log("originCommit", originCommit);
    await exec.exec(`git submodule update --init --recursive ${input.path}`, [], {
        cwd: repoDir,
    });

    await exec.exec(`git submodule update --remote --merge ${input.path}`, [], {
        cwd: repoDir,
    });

    await exec.exec(`git checkout ${github.context.ref}`, [], { cwd: `${repoDir}/${input.path}` });

    const submoduleNewInfo = await exec.getExecOutput(`git submodule status ${input.path}`, [], {
        cwd: repoDir,
    });

    const newCommit = submoduleNewInfo.stdout.split(" ")[0].slice(1);

    console.log("newCommit", newCommit);

    if (originCommit === newCommit) {
        core.info("No update");
        return;
    }

    core.info(`Compare ${originCommit} and ${newCommit}`);
    const octokit = github.getOctokit(input.token);

    const { data: commits } = await octokit.rest.repos.compareCommits({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        base: originCommit,
        head: newCommit,
    });

    const msg = await Promise.all(
        commits.commits.reverse().map(async (commit) => await getMessage(octokit, commit as Commit))
    );

    const author = commits.commits[0].author?.login;

    core.info(`config git user ${input.committor_username} <${input.committor_email}>`);
    await exec.exec(`git config --global user.email "${input.committor_email}"`, [], {
        cwd: repoDir,
    });
    await exec.exec(`git config --global user.name "${input.committor_username}"`, [], {
        cwd: repoDir,
    });

    core.info(`add ${input.path} to git`);
    await exec.exec(`git add ${input.path}`, [], {
        cwd: repoDir,
    });

    await exec.exec(`git commit --author="${author} <>"  -m "${msg.join("\n")}"`, [], {
        cwd: repoDir,
    });

    core.info(`push ${input.path} to git with ref ${github.context.ref}`);
    await exec.exec(`git push origin ${github.context.ref}`, [], {
        cwd: repoDir,
    });

    await io.rmRF(path.join(os.tmpdir(), "repo"));
    core.info("Done.");
}

try {
    run();
} catch (error) {
    core.setFailed(error.message);
}
