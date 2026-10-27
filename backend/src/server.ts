import { app } from './app.js';
import { config } from './config/index.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 [CloudBite Backend] Server is running at http://localhost:${PORT}`);
  console.log(`📡 [API Docs/Health] http://localhost:${PORT}/`);
  console.log(`📦 [API Prefix] http://localhost:${PORT}${config.apiPrefix}`);
});
