/** Build validation must never inherit deployment storage or access secrets. */
export function buildSmokeEnvironment(parent, { dataDir, port, deployHost }) {
  const env = { ...parent };
  for (const key of Object.keys(env)) {
    if (/^(?:VERCEL(?:_|$)|TURSO_|CLOUDINARY_|NEARBY_CLOUD_|NEARBY_RUN_CLOUD_|ADMIN_SETUP_TOKEN$)/i.test(key)) delete env[key];
  }
  return {
    ...env,
    NEARBY_DATABASE: 'sqlite',
    IMAGE_STORAGE: 'mock-cloudinary',
    LOCAL_DATA_DIR: dataDir,
    PORT: String(port),
    HOST: '127.0.0.1',
    RENDER_EXTERNAL_HOSTNAME: deployHost,
    ALLOWED_HOSTS: '',
    COOKIE_SECURE: '0',
    OWNER_AUTO_APPROVAL: '0',
    SEED_SAMPLE_DATA: '0',
    NODE_ENV: 'production',
  };
}
