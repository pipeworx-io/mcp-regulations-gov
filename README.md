# @pipeworx/regulations-gov

Regulations.gov v4 MCP — federal regulatory dockets, documents, public comments.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1679+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/regulations-gov/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1679+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/regulations_gov_search_dockets \
  -H 'Content-Type: application/json' \
  -d '{"query":"emissions standards","agency":"EPA","docket_type":"Rulemaking"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/regulations_gov_search_dockets`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "regulations-gov": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-regulations-gov"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-regulations-gov
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Regulations Gov data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
