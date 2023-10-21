import express, { Express, Request, Response } from 'express';
import { safeController } from "./controllers/SafeController";

const app: Express = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded());

app.get('/', (req: Request, res: Response) => {
  res.send('Typescript + Node.js + Express Server');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at <http://localhost>:${port}`);
});

app.post("/deploy-safe-aa", safeController.deploySafeAA);
app.post("/confirm-tx", safeController.confirmTx);
