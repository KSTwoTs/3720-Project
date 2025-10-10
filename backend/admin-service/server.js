import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import adminRoutes from './routes/adminRoutes.js';
import './setup.js'; // initialize DB schema at startup


const app = express();
app.use(cors());
app.use(express.json());


app.use('/api', adminRoutes);


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Admin service running on port ${PORT}`));
