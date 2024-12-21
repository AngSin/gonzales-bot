# Use an official Node.js runtime as the base image
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["node", "src/app.js"]