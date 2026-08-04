# @pipeworx/regulations-gov

Regulations.gov v4 MCP — federal regulatory dockets, documents, public comments.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `search_dockets(query?, agency?, docket_type?, last_modified_from?, last_modified_to?, page_size?, page_number?)`
- `get_docket(docket_id)`
- `list_documents(docket_id?, query?, document_type?, page_size?, page_number?)`
- `search_comments(docket_id?, document_id?, query?, posted_from?, posted_to?, page_size?, page_number?)`
- `get_comment(comment_id, include_attachments?)`

## Auth

- **Platform key:** reuses `PLATFORM_DATAGOV_KEY` (the data.gov umbrella key).
- **BYO:** `?_apiKey=<key>` after registering at https://open.gsa.gov/api/regulationsgov/.

Free tier: 1,000 req/hour.

## Data source

`https://api.regulations.gov/v4/` — header `X-Api-Key`, JSON:API format.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

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

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
