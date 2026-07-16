module.exports = {
  apps: [
    {
      name: 'gms-webapp',
      script: 'npx',
      args: 'tsx server.mjs',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        DATA_DIR: '/home/user/webapp/data'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
