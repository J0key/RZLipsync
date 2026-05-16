FROM node:20-slim

# Install Python, espeak-ng (required by phonemizer), and build tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    espeak-ng \
    espeak-ng-data \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Make python3 available as python
RUN ln -s /usr/bin/python3 /usr/bin/python

# Install phonemizer
RUN pip3 install phonemizer --break-system-packages

WORKDIR /app

# Install Node dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source and build frontend
COPY . .
RUN yarn build

EXPOSE 3002

ENV NODE_ENV=production

CMD ["node", "server/tts.js"]
