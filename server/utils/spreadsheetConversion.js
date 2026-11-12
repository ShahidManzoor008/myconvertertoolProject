import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const worker = fileURLToPath(new URL('./spreadsheet_worker.py', import.meta.url));
const defaultPython = fileURLToPath(new URL('../../.venv-spreadsheet/bin/python', import.meta.url));
let active = false;

function runWorker(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.SPREADSHEET_PYTHON || defaultPython, [worker, ...args], {
      detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '', stderr = '', failure;
    const stop = error => {
      failure = error;
      try {
        if (process.platform !== 'win32') process.kill(-child.pid, 'SIGKILL');
        else child.kill('SIGKILL');
      } catch { /* Process may have already exited. */ }
    };
    const timeout = setTimeout(() => stop(new SpreadsheetError('Conversion timed out. Try a smaller document.', 408)), 150000);
    child.stdout.on('data', data => {
      stdout += data;
      if (Buffer.byteLength(stdout) > 8 * 1024 * 1024) stop(new SpreadsheetError('Table preview exceeds the limit. Split this PDF first.'));
    });
    child.stderr.on('data', data => { stderr = (stderr + data).slice(-8192); });
    child.once('error', error => { failure = error; });
    child.once('close', code => {
      clearTimeout(timeout);
      if (failure) reject(failure);
      else if (code !== 0) reject(new SpreadsheetError(stderr.includes('ModuleNotFoundError')
        ? 'Spreadsheet conversion dependencies are not installed on the server.' : 'Could not read this document. Try a valid, unlocked file.', stderr.includes('ModuleNotFoundError') ? 503 : 422));
      else resolve(stdout);
    });
  });
}

export class SpreadsheetError extends Error {
  constructor(message, status = 422) { super(message); this.status = status; }
}

export function spreadsheetOptions(mode, body = {}) {
  if (mode === 'pdf-to-excel') {
    const tableMode = body.tableMode || 'lines';
    if (!['lines', 'text'].includes(tableMode)) throw new SpreadsheetError('Choose a valid table detection mode.', 400);
    return { tableMode };
  }
  const orientation = body.orientation || 'landscape';
  const paperSize = body.paperSize || 'A4';
  if (!['portrait', 'landscape'].includes(orientation) || !['A4', 'Letter'].includes(paperSize)) {
    throw new SpreadsheetError('Choose a valid page size and orientation.', 400);
  }
  if (body.fitToWidth !== undefined && !['true', 'false', true, false].includes(body.fitToWidth)) {
    throw new SpreadsheetError('Fit to width must be true or false.', 400);
  }
  return { orientation, paperSize, fitToWidth: body.fitToWidth !== 'false' && body.fitToWidth !== false };
}

export async function convertSpreadsheet(mode, input, extension, options) {
  if (active) throw new SpreadsheetError('Spreadsheet converter is busy. Try again shortly.', 503);
  active = true;
  let directory;
  try {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'myconvertertool-sheet-'));
    const source = path.join(directory, `input.${extension}`);
    await fs.copyFile(input, source);
    const stdout = await runWorker([mode, source, directory, JSON.stringify(options)]);
    const result = JSON.parse(stdout);
    if (result.error) throw new SpreadsheetError(result.error);
    const stat = await fs.stat(result.output);
    if (stat.size > 30 * 1024 * 1024) throw new SpreadsheetError('Output exceeds 30 MB. Try a smaller document.');
    return { buffer: await fs.readFile(result.output), preview: result.preview || [], warnings: result.warnings || [] };
  } catch (error) {
    if (error instanceof SpreadsheetError) throw error;
    if (error.code === 'ENOENT') throw new SpreadsheetError('Spreadsheet conversion is unavailable. The server needs its spreadsheet dependencies installed.', 503);
    if (error.killed) throw new SpreadsheetError('Conversion timed out. Try a smaller document.', 408);
    throw new SpreadsheetError('Could not convert this document. Try a valid, unlocked file.');
  } finally {
    try { if (directory) await fs.rm(directory, { recursive: true, force: true }); }
    finally { active = false; }
  }
}
