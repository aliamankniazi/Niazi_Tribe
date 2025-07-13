module.exports = {
  apps: [
    {
      name: 'niazi-tribe-ui',
      cwd: './apps/ui',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      error_file: './logs/ui-error.log',
      out_file: './logs/ui-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'niazi-tribe-gedcom',
      cwd: './services/gedcom',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'development'
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      error_file: './logs/gedcom-error.log',
      out_file: './logs/gedcom-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
}; 