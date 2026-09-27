import express from 'express';
import { getExchangeRates } from '../controllers/exchangeRateController.js';

const exchangeRateRouter = express.Router();

exchangeRateRouter.get('/', getExchangeRates);

export default exchangeRateRouter;
