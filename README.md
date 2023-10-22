# safe-protocol-backend

## How we used Safe{Core} Protocol Kit SDK
We are providing two kinds of API for AA by using Safe Protocol kit.
- Deploy Safe AA contract for Web3Auth logined user.
- If user provide Safe transaction signature to this server, it confirms it and propose it instead of user. So, user doesn't need to spend gas her/himself.

## Providing API
```
POST http://localhost:3000/deploy-safe-aa
body: user

POST http://localhost:3000/confirm-tx
body: tx_hash, safe_address
```

## Server run
Before running the server, you need to fill in .env file first. Here is the format to fill in.
```
export OWNER_1_PRIVATE_KEY=
```

And server running command is like below.
```
npm install
npm run build
npm run start
```
