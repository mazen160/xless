#!/bin/bash
read -p "Enter Slack Incoming Hook: " "slack_incoming_webhook"
now secret add slack-incoming-webhook "$slack_incoming_webhook"
now deploy
