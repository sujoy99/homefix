import { Router } from 'express';
import v1Routes from './v1';
import v2Routes from './v2';

export function registerRoutes(app: Router) {
  app.use('/api/v1', v1Routes);
  app.use('/api/v2', v2Routes);
}
