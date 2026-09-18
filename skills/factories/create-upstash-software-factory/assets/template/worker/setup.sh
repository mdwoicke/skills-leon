#!/bin/bash
# Defines what goes into the worker image. scripts/build-snapshot.mjs runs this
# inside a Box and then takes a snapshot of the result.
#
# Put slow, rarely changing things here: agent CLIs the Box image lacks, agent
# skills, MCP servers, a browser, language toolchains. Keep app code and secrets
# out. Code goes stale, and the factory writes secrets at the start of each job.
#
# Facts about a Box: Debian 12 on ARM64, user "boxuser" with passwordless sudo,
# Node, git, Claude Code and Codex already installed.
set -euo pipefail

# --- Agent skills (example) ------------------------------------------------
# Installs one skill globally for the listed agents. Claude Code reads
# ~/.claude/skills, Codex reads ~/.agents/skills.
add_skill() {
  echo "--- skill: $2"
  npx -y skills@latest add "$1" --skill "$2" --global --agent claude-code codex --copy --yes
}
# add_skill https://github.com/anthropics/skills frontend-design

# --- A browser for agents that check their own work (example) ---------------
# Chrome has no ARM64 Linux download, so use Debian's Chromium.
# sudo apt-get update -qq
# sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq chromium > /dev/null
# sudo npm install --global --silent agent-browser
# echo "export AGENT_BROWSER_EXECUTABLE_PATH=$(command -v chromium)" | sudo tee /etc/profile.d/agent-browser.sh > /dev/null

# --- Another agent CLI (example) ---------------------------------------------
# sudo npm install --global --silent opencode-ai

# --- Check ---------------------------------------------------------------------
# The build log is the only evidence of what is in the image, and the build
# must fail when something is missing. List every tool the workers rely on.
echo "--- check"
node --version
git --version
# claude --version
# codex --version
