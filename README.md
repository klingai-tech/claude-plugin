# Kling AI for Claude

One repository and one marketplace, with separate China and Global plugins.
Both plugins are published from the default branch; choosing a region does not
require selecting a Git branch or adding another repository.

| Directory | Plugin in Claude App | Plugin ID | MCP endpoint |
| --- | --- | --- | --- |
| `cn/` | Kling AI CN | `kling-ai-cn` | `https://klingai.com/mcp/plugin` |
| `global/` | Kling AI Global | `kling-ai` | `https://kling.ai/mcp/plugin` |

The Global plugin retains the existing `kling-ai` ID, so existing marketplace
installations continue to use the Global service. The marketplace name remains
`klingai`.

## Install in Claude App

1. Open **Customize → Plugins → Add → Add marketplace → Add from a repository**.
2. Enter `https://github.com/klingai-tech/claude-plugin` and click **Sync**.
3. Install **Kling AI CN** for China or **Kling AI Global** for Global.
4. Use the App's native connector controls to authorize the matching account.

If the marketplace is already added, open **Add → Manage marketplaces**, find
`claude-plugin`, and choose **Check for updates** before selecting a plugin.
Enable only one regional Kling plugin at a time. Before switching regions,
finish outstanding task checks in the original region, disable the old plugin,
disconnect its OAuth connection, and authorize the other region. Accounts,
credits, and task IDs are specific to their region.

## Install in Claude Code

Add the marketplace once, then choose one plugin:

```bash
claude plugin marketplace add klingai-tech/claude-plugin

# China
claude plugin install kling-ai-cn@klingai

# Global (existing plugin ID)
claude plugin install kling-ai@klingai
```

For a local review, load the regional directory rather than the catalog root:

```bash
claude --plugin-dir ./cn
# or
claude --plugin-dir ./global
```

## Plugin contents

Each region contains its own manifest, MCP declaration, three Skills with all
their references, README, and LICENSE. Both packages are self-contained and use
the same generation workflows with region-specific connections and account
instructions. They contain no local MCP server or credentials.

See [China plugin instructions](cn/README.md) or
[Global plugin instructions](global/README.md) for capabilities, connection
details, and data handling. Generation and account operations contact the
selected remote Kling service. The Skills require approval of final settings
before credit-consuming generation.

## Validate and package

```bash
npm test
claude plugin validate . --strict
claude plugin validate cn/.claude-plugin/plugin.json --strict
claude plugin validate global/.claude-plugin/plugin.json --strict
```

For a manual App upload, ZIP the contents of **one** regional directory,
including hidden files. Do not upload the entire marketplace as one plugin.
See the [release checklist](docs/RELEASE_CHECKLIST.md) for the remaining checks.
