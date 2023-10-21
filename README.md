# safe-protocol-backend

## 제공 API
```
POST http://localhost:3000/deploy-safe-aa
body: user

POST http://localhost:3000/confirm-tx
body: tx_hash, safe_address
```

## 참고할 전체 플로우 테스트코드
src/safeProtocolKit.ts

## 실행법
```
npm install
npm run build
npm run start
```