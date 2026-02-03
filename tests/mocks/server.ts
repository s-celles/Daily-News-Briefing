/**
 * MSW server configuration for testing
 */
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Create MSW server instance with default handlers
export const server = setupServer(...handlers);
