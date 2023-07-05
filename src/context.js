"use strict";
exports.__esModule = true;
exports.getInputs = void 0;
function getInputs() {
    return {
        user: "fatjyc",
        token: "4ac888a9e5a51fa0690208a1370ca851bd0779b1",
        repo: "submodule-demo",
        repo_owner: "fatjyc",
        committor_username: "robot",
        committor_email: "robot@jiong.io",
        path: "deno-server-demo"
    };
    // return {
    //     user: core.getInput("user", { required: true }),
    //     token: core.getInput("token", { required: true }),
    //     repo: core.getInput("repo", { required: true }),
    //     repo_owner: core.getInput("repo_owner", { required: true }),
    //     committor_username: core.getInput("committor_username", { required: true }),
    //     committor_email: core.getInput("committor_email", { required: true }),
    //     path: core.getInput("path", { required: true }),
    // };
}
exports.getInputs = getInputs;
