#!/bin/bash
vercel secret add slack-incoming-webhook "https://hooks.slack.com/services/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"

vercel secret add imgbb-api-key "d1e2b459ba603a35da64276cdec91790"

vercel deploy
