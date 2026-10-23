/**
 * Prisma Client Singleton Instance with Resilient Fast-Fail Circuit Breaker
 * Pravah V2 - Phase 1B
 */

const { PrismaClient } = require('@prisma/client');
const net = require('net');

let rawPrisma;

if (process.env.NODE_ENV === 'production') {
  rawPrisma = new PrismaClient();
} else {
  // In development, avoid exhausting connection pool across hot reloads
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: process.env.PRISMA_LOG === 'true' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    });
  }
  rawPrisma = global.__prisma;
}

// Parse database host & port for fast TCP check
function getDbHostPort() {
  const dbUrl = process.env.DATABASE_URL || '';
  try {
    const match = dbUrl.match(/@([^:/]+)(?::(\d+))?/);
    if (match) {
      const host = match[1] === 'localhost' ? '127.0.0.1' : match[1];
      const port = match[2] ? parseInt(match[2], 10) : 5432;
      return { host, port };
    }
  } catch {
    // fallback
  }
  return { host: '127.0.0.1', port: 5432 };
}

function checkTcpPort(host, port, timeout = 80) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

let isDbOnline = null;
let lastCheck = 0;
const CHECK_INTERVAL_MS = 10000;

async function ensureDbReachable() {
  const now = Date.now();
  if (isDbOnline === false && now - lastCheck < CHECK_INTERVAL_MS) {
    throw new Error("Can't reach database server at `localhost:5432`");
  }
  const { host, port } = getDbHostPort();
  const reachable = await checkTcpPort(host, port, 80);
  lastCheck = Date.now();
  if (!reachable) {
    isDbOnline = false;
    throw new Error("Can't reach database server at `localhost:5432`");
  }
  isDbOnline = true;
}

function createCircuitBreakerPrisma(target) {
  return new Proxy(target, {
    get(obj, prop) {
      if (prop === '$disconnect') {
        return async () => {
          try {
            return await obj.$disconnect();
          } catch {
            return;
          }
        };
      }
      const val = obj[prop];
      if (typeof val === 'function') {
        return async function (...args) {
          await ensureDbReachable();
          return val.apply(obj, args);
        };
      }
      if (typeof val === 'object' && val !== null) {
        return new Proxy(val, {
          get(subObj, subProp) {
            const subVal = subObj[subProp];
            if (typeof subVal === 'function') {
              return async function (...args) {
                await ensureDbReachable();
                return subVal.apply(subObj, args);
              };
            }
            return subVal;
          }
        });
      }
      return val;
    }
  });
}

const prisma = createCircuitBreakerPrisma(rawPrisma);

module.exports = prisma;
