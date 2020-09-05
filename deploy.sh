#!/bin/bash
read -p "Enter Slack Incoming Hook: " "slack_incoming_webhook"
vercel secret add slack-incoming-webhook "$slack_incoming_webhook"
vercel deploy
