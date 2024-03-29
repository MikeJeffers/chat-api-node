#!/bin/bash
export $(grep -v '^#' scripts/.env | xargs -d '\n')
docker compose up -d psql redis
sleep 1
while ! nc -z localhost $REDIS_PORT; do   
  sleep 0.5
done
while ! nc -z localhost $POSTGRES_PORT; do   
  sleep 0.5
done
