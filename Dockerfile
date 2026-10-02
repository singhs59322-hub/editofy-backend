FROM node:18
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 10000
CMD ["npm", "start"]
