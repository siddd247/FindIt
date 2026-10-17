// The college presentation accepts authenticated owner registrations immediately.
// Anonymous submissions still require review. Set OWNER_AUTO_APPROVAL=0 for moderation.
process.env.OWNER_AUTO_APPROVAL ??= '1';
await import('../local/server.mjs');
