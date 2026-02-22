FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build frontend
RUN npm run build

EXPOSE 3001

ENV NODE_ENV=production

CMD ["npx", "tsx", "api/server.ts"]
