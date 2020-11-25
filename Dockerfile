FROM node:15.3.0-alpine3.10
ENV NODE_ENV=production
WORKDIR /usr/src/cscareers-chanserv
COPY package.json .
RUN yarn
COPY . .
RUN yarn build
CMD ["node", "./build/index.js"]