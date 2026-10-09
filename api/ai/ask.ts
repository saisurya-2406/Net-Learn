import type { IncomingMessage, ServerResponse } from 'node:http';
import app from '../../server';

type ExpressRequestHandler = (request: IncomingMessage, response: ServerResponse) => void;

const handleExpressRequest = app as unknown as ExpressRequestHandler;

export default function handler(request: IncomingMessage, response: ServerResponse) {
  handleExpressRequest(request, response);
}
