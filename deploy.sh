#!/bin/bash
read -p "Enter Xless project name: " "project_name"
vercel project add "$project_name"
vercel env add SLACK_INCOMING_WEBHOOK 
vercel env add IMGBB_API_KEY
# Bearer token that protects GET /xless-history and the /xless-mcp MCP server.
# Nothing else creates this token: the serverless app cannot generate its own
# (Vercel env vars are set at config time, not at runtime), so we mint a strong
# one here on first deploy and store it as a Vercel env var.
xless_token=$(openssl rand -hex 32)
if printf '%s' "$xless_token" | vercel env add XLESS_HISTORY_API_TOKEN production 2>/dev/null; then
  echo ""
  echo "======================================================================"
  echo " Generated XLESS_HISTORY_API_TOKEN (save it now - shown only once):"
  echo "   $xless_token"
  echo "======================================================================"
  echo ""
else
  echo "XLESS_HISTORY_API_TOKEN already exists in production - keeping it."
  echo "To rotate: vercel env rm XLESS_HISTORY_API_TOKEN production, then re-run."
fi
# Create a private Vercel Blob store for request history and link it to the
# production environment (this injects BLOB_READ_WRITE_TOKEN).
vercel blob create-store xless-history --access private --environment production --yes
vercel deploy
