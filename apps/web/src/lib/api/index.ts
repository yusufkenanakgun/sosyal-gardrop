'use client';

// Re-export everything from modular files
export * from './types';
export * from './session';
export { auth } from './auth';
export { files, presignUpload, completeUpload, listItems } from './files';
export * from './messages';

// Main API object for backward compatibility
import { auth as authModule } from './auth';
import { files } from './files';
import { restore } from './session';
import * as messages from './messages';

export const api = {
  ...authModule,
  restore,
  files,
  messages,
};
