#!/usr/bin/env node
import { GitMCPServer } from './server.js';

const server = new GitMCPServer();
server.run().catch(console.error);
