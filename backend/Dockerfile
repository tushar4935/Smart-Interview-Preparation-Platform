FROM node:20-alpine

WORKDIR /app

# install prod deps first for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# runtime dirs that aren't checked in
RUN mkdir -p uploads/resumes logs

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
