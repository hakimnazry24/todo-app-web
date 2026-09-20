# Questions

1. What ConsoleLogger is for
We are replacing default ConsoleLogger object with the custom config one. The json config is to make sure it render the logs in json, making it easy to filter in CloudWatch

2. What NGINX_ENVSUBST_FILTER does
envsubst is a tiny program that reads ${NAME} and replaces it with environment variable NAME.

3. COPY in Dockerfile
FROM node:22-alpine AS build --> Stage 1
FROM nginx:alpine as runtime --> Stage 2 (separate build from stage 1)

Stage 2 does not inherit anything from stage 1
Meaning, to copy files from different stage, use COPY from="" to copy from different stage

4. What environment does in docker-compose?
It sets environment variables in running container