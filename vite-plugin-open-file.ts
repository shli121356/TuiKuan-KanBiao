import { randomUUID } from 'node:crypto';
import { execFile, type ChildProcess } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

type SavedFile = { filePath: string; expiresAt: number };

const savedFiles = new Map<string, SavedFile>();
const MAX_FILE_SIZE = 80 * 1024 * 1024;
const FILE_TTL_MS = 10 * 60 * 1000;

function sendJson(response: import('node:http').ServerResponse, status: number, body: unknown) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

async function readRequest(request: import('node:http').IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_FILE_SIZE) throw new Error('文件过大');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function openWithWindowsAssociation(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child: ChildProcess = execFile('cmd.exe', ['/d', '/c', 'start', '', filePath], { windowsHide: true }, (error) => {
      if (error) reject(error);
      else resolve();
    });
    child.unref();
  });
}

export function openFilePlugin(): Plugin {
  return {
    name: 'open-file-with-system-association',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/__open-file/save', async (request, response) => {
        if (request.method !== 'POST') return sendJson(response, 405, { error: 'method not allowed' });
        try {
          const bytes = await readRequest(request);
          const token = randomUUID();
          const requestedName = decodeURIComponent(String(request.headers['x-file-name'] || 'ledger.xlsx'));
          const extension = path.extname(requestedName).toLowerCase() || '.xlsx';
          const filePath = path.join(os.tmpdir(), `tuikuan-kanbiao-${token}${extension}`);
          await fs.writeFile(filePath, bytes);
          savedFiles.set(token, { filePath, expiresAt: Date.now() + FILE_TTL_MS });
          setTimeout(() => {
            const saved = savedFiles.get(token);
            if (!saved || saved.expiresAt > Date.now()) return;
            savedFiles.delete(token);
            void fs.rm(saved.filePath, { force: true }).catch(() => undefined);
          }, FILE_TTL_MS + 1000);
          return sendJson(response, 200, { token });
        } catch (error) {
          return sendJson(response, 400, { error: error instanceof Error ? error.message : 'save failed' });
        }
      });

      server.middlewares.use('/__open-file/launch', async (request, response) => {
        if (request.method !== 'POST') return sendJson(response, 405, { error: 'method not allowed' });
        try {
          const payload = JSON.parse((await readRequest(request)).toString('utf8')) as { token?: string };
          const saved = payload.token ? savedFiles.get(payload.token) : undefined;
          if (!saved || saved.expiresAt <= Date.now()) return sendJson(response, 404, { error: 'file expired' });
          await openWithWindowsAssociation(saved.filePath);
          return sendJson(response, 200, { opened: true });
        } catch (error) {
          return sendJson(response, 500, { error: error instanceof Error ? error.message : 'launch failed' });
        }
      });
    },
  };
}
