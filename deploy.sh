#!/bin/bash
read -p "Enter Xless project name: " "project_name"
vercel project add "$project_name"
vercel env add SLACK_INCOMING_WEBHOOK 
vercel env add IMGBB_API_KEY
vercel deploy
