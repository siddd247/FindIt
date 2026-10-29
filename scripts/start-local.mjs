// Account access is immediate; every new public shop listing requires administrator review.
process.env.OWNER_AUTO_APPROVAL = '0';
const { startLocalServer } = await import('../local/server.mjs');
startLocalServer();
