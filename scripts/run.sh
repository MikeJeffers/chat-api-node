#!/bin/bash
export $(grep -v '^#' scripts/.env | xargs -d '\n')
./scripts/deps-up.sh
node index