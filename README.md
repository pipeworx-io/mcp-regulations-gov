# mcp-regulations-gov

Regulations.gov MCP — federal regulatory dockets, documents, public comments

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 673+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_docket` | Single docket detail by docketId (e.g., "EPA-HQ-OAR-2021-0317"). Returns full metadata + summary counts. |
| `get_comment` | Single public comment by comment ID. Returns text, submitter, posting date, attachments. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "regulations-gov": {
      "url": "https://gateway.pipeworx.io/regulations-gov/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 673+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Regulations Gov data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
