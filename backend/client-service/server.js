// Task 2 — Client Microservice host
//   • Exposes public API the React app uses (GET events, POST purchase)
// Task 6 — Code Quality (simple, modular, minimal middleware)

import express from 'express';
import cors from 'cors';
import clientRoutes from './routes/clientRoutes.js';


const app = express();

// Allow the frontend (and Postman) to call this API
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Mount public endpoints under /api
app.use('/api', clientRoutes);

// By spec, client service runs on 6001 (frontend points here)
const PORT = process.env.PORT || 6001;
app.listen(PORT, () => console.log(`Client service running on port ${PORT}`));
export default app;