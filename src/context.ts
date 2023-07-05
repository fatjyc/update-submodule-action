import * as core from "@actions/core";

export interface Inputs {
    user: string;
    token: string;
    repo: string;
    repo_owner: string;
    committor_username: string;
    committor_email: string;
    path: string;
}

export function getInputs(): Inputs {
    return {
        user: core.getInput("user", { required: true }),
        token: core.getInput("token", { required: true }),
        repo: core.getInput("repo", { required: true }),
        repo_owner: core.getInput("repo_owner", { required: true }),
        committor_username: core.getInput("committor_username", { required: true }),
        committor_email: core.getInput("committor_email", { required: true }),
        path: core.getInput("path", { required: true }),
    };
}
