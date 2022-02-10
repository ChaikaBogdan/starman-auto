
# build environment
FROM mcr.microsoft.com/playwright:focal
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package*.json /app/
COPY tests/ /app/tests/
COPY playwright.config.ts /app/
RUN npm install
EXPOSE 9323