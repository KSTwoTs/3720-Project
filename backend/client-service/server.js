import express from 'express';
import cors from 'cors';
import clientRoutes from './routes/clientRoutes.js';


const app = express();
app.use(cors());
app.use(express.json());


app.use('/api', clientRoutes);


const PORT = process.env.PORT || 6001;
app.listen(PORT, () => console.log(`Client service running on port ${PORT}`));
