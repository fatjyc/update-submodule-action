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

const getMessage = async (octokit: ReturnType<typeof github.getOctokit>, commit: Commit) => {
    let msg = "";
    if (commit.commit.message.match(MERGE_REGEX)) {
        const matches = commit.commit.message.match(MERGE_REGEX);
        const pr = matches?.[1];
        if (!pr) {
            msg = `* ${commit.sha.slice(0, 7)} ${commit.commit.message} - @${commit.author?.login}`;
        } else {
            const prInfo = await getPRInfo(octokit, Number(pr));
            msg = `* ${commit.sha.slice(0, 7)} ${commit.commit.message
                .replace(MERGE_REGEX, `PR ${prInfo.head?.repo?.full_name}#${pr}`)
                .replace(/\n/g, " ")} - @${commit.author?.login}`;
        }
    } else {
        msg = `* ${commit.sha.slice(0, 7)} ${commit.commit.message} - @${commit.author?.login}`;
    }

    return msg;
};

async function run() {
    // core.info("Update git submodule");
    const input = getInputs();
    //
    const repoUrl = `https://${input.user}:${input.token}@github.com/${input.repo_owner}/${input.repo}.git`;
    const octokit = github.getOctokit(input.token);
    const repoDir = path.join(os.tmpdir(), "repo");
    await io.mkdirP(repoDir);
    await exec.exec(`git clone ${repoUrl} ${repoDir}`);

    core.info(`Update submodule ${input.path}`);
    console.log("repoDir", repoDir);

    const submoduleInfo = await exec.getExecOutput(`git submodule status ${input.path}`, [], {
        cwd: repoDir,
    });

    console.log(submoduleInfo.stdout);
    const originCommit = submoduleInfo.stdout.split(" ")[0].slice(1);
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

    console.log("status", submoduleNewInfo.stdout);

    const newCommit = submoduleNewInfo.stdout.split(" ")[0].slice(1);

    console.log("newCommit", newCommit);

    if (originCommit === newCommit) {
        core.info("No update");
        return;
    }
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

    await exec.exec(`git config --global user.email "${input.committor_email}"`, [], {
        cwd: repoDir,
    });
    await exec.exec(`git config --global user.name "${input.committor_username}"`, [], {
        cwd: repoDir,
    });

    await exec.exec(`git add ${input.path}`, [], {
        cwd: repoDir,
    });

    await exec.exec(`git commit --author="${author} <>"  -m "${msg.join("\n")}"`, [], {
        cwd: repoDir,
    });

    await exec.exec(`git push origin ${github.context.ref}`, [], {
        cwd: repoDir,
    });

    await io.rmRF(path.join(os.tmpdir(), "repo"));
}

try {
    run();
} catch (error) {
    core.setFailed(error.message);
}
