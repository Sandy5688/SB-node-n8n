module.exports = {
  apps: [
    {
      name: 'api',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'worker',
      script: 'dist/workers/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        ENABLE_WORKERS: 'true'
      }
    }
  ]
};


