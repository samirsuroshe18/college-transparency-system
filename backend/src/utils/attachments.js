import { storeFile } from './uploads.js';

// Stores the file a form carried, if it may be stored. Returns { url, problem }:
// problem is null, "demo" (the demo accounts are public, so their files are not kept)
// or "failed" (no file store, or the upload did not work). The form itself is saved either way.
const attach = async (req, folder) => {
    if (!req.file) return { url: null, problem: null };

    if (req.user.isDemo) return { url: null, problem: 'demo' };

    const url = await storeFile(req.file, folder).catch(() => null);

    return url ? { url, problem: null } : { url: null, problem: 'failed' };
};

// what to tell the user after "<Thing> submitted"
const attachmentNote = (problem) => {
    if (problem === 'demo') return '. Files are not stored for demo accounts.';
    if (problem === 'failed') return ', but the file could not be stored';
    return '';
};

export { attach, attachmentNote }
