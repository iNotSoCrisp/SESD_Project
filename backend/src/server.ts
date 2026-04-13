import dotenv from 'dotenv';
import { app } from './app';

dotenv.config();

const portValue = process.env.PORT;
const port = portValue !== undefined ? Number(portValue) : 3000;

if (Number.isNaN(port)) {
  throw new Error('PORT must be a valid number.');
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});