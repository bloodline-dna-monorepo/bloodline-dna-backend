import app from './app';
import { port } from './config';
import { initDefaultAdmin } from './utils/initAdmin';

async function start() {
  await initDefaultAdmin();

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

start().catch(err => {
  console.error('Failed to start server', err);
});
