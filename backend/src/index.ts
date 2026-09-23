import app from './app';
import { ensureCollection } from './services/qdrant.service';

const PORT = process.env.PORT || 4000;

ensureCollection().catch((err) => {
  console.error('Failed to initialize Qdrant collection:', err);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
