# Use an official Node.js runtime as the base image
FROM node:22-alpine

WORKDIR /usr/src/app

COPY . .

RUN npm run build

CMD ["node", "src/app.js"]