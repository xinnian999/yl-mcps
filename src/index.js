#!/usr/bin/env node
import { YLMCPServer } from './server.js';

const server = new YLMCPServer();
server.run().catch(console.error);
