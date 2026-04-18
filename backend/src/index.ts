import app from './server';
import { config } from './config/config';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs available at http://localhost:${PORT}${config.apiPrefix}`);
  console.log(`🔧 Environment: ${config.debug ? 'development' : 'production'}`);
});
