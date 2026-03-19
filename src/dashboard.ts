import express from 'express';
import { predict_route } from './optimization';

const app = express();
const port = 3001;

app.use(express.json());

// Endpoint to predict a route
app.post('/predict-route', (req, res) => {
    const { features } = req.body;
    try {
        const predictedDistance = predict_route(features);
        res.json({ predictedDistance });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(port, () => {
    console.log(`Dashboard Server running on port ${port}`);
});
