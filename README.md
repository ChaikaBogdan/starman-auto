# starman-auto
![Alt text](logo.jpg?raw=true "reds goes fasta")
> There's a starman waiting in the sky

## About project
Example of Playwright test automation for a very specific react-based, sockets-fueled gambling game.

The main goal of assigment to be able to run test scenarios in constanly changing by sockets state of the game

There is only one test [spec file](https://github.com/ChaikaBogdan/starman-auto/blob/main/tests/livecrash.spec.ts) which also contains my thoughts&notes about automation of this project.

## Why not Cypress?
Playwright supports new tabs, sockets inspection, visual testing out the box. It's also supports regular [POM](https://github.com/ChaikaBogdan/starman-auto/blob/main/tests/pages/livecrash.ts) and allow to write normal sync/sync TS code.
Worth to mention, what [Github Actions](https://github.com/ChaikaBogdan/starman-auto/actions) and Docker are much easier to prepare&run. 

## How to run
```
npm install 
npx playwright install
npx playwright test (add --headed to watch tests live)
```
## How to run using Docker
```
docker-compose up --build
```
Please refer to [Playwright getting started](https://playwright.dev/docs/intro) for additional info
