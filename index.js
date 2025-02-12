#!/usr/bin/env node

const core = require("@actions/core");
const { context, GitHub } = require("@actions/github");

async function run() {
    const trigger = core.getInput("trigger", { required: true });

    const reaction = core.getInput("reaction");
    const { GITHUB_TOKEN } = process.env;
    if (reaction && !GITHUB_TOKEN) {
        core.setFailed('If "reaction" is supplied, GITHUB_TOKEN is required');
        return;
    }

    const body =
        (context.eventName === "issue_comment"
        // For comments
            ? context.payload.comment.body
            // For the initial issue description
            : context.payload.issue.body) || '';
    core.debug(body);
    core.setOutput('comment_body', body);

    const { owner, repo } = context.repo;


    const prefixOnly = core.getInput("prefix_only") === 'true';
    if ((prefixOnly && !body.startsWith(trigger)) || !body.includes(trigger)) {
        core.setOutput("triggered", "false");
        core.debug('didnt find the trigger')
        return;
    }
    core.debug('found da trigger')

    core.setOutput("triggered", "true");

    if (!reaction) {
        return;
    }

    const client = new GitHub(GITHUB_TOKEN);
    if (context.eventName === "issue_comment") {
        await client.reactions.createForIssueComment({
            owner,
            repo,
            comment_id: context.payload.comment.id,
            content: reaction
        });
    } else {
        await client.reactions.createForIssue({
            owner,
            repo,
            issue_number: context.payload.issue.number,
            content: reaction
        });
    }
}

run().catch(err => {
    console.error(err);
    core.setFailed("Unexpected error");
});
