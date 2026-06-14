FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV API_PORT=8080

EXPOSE 8080

CMD ["npm", "run", "start:prod"]
