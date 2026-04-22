# toomanytools capabilities

## live now

### media / video
- Remotion workspace installed
- `@remotion/mcp` installed
- ffmpeg present on system
- render folders scaffolded

### charts / diagrams
- `@antv/mcp-server-chart` installed
- `mcp-mermaid` installed
- `svgo` installed for SVG optimization
- chart and svg asset folders scaffolded

### browser / automation
- `@playwright/mcp` installed

### image / asset processing
- `sharp` installed

### doctoring / verification
- `npm run doctor`

## not live yet
- Blender (not installed on host)
- dedicated image generation backend/model runtime
- dedicated 3D asset pipeline
- Photoshop/Figma-class external app integrations
- fully registered MCP config inside OpenClaw runtime

## runnable entrypoints
- `npm run mcp:remotion`
- `npm run mcp:charts`
- `npm run mcp:playwright`
- `npm run mcp:mermaid`
- `npm run remotion:studio`
- `npm run doctor`

## current truth
This workspace is now a real local package/toolbox, not just an agent shell.
It still needs explicit OpenClaw MCP registration if you want these exposed as first-class runtime capabilities inside agent sessions.
