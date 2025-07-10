module.exports = {
  apps: [
    {
      name: 'niazi-tribe-ui',
      cwd: './apps/ui',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: '/var/log/niazi-tribe/ui-error.log',
      out_file: '/var/log/niazi-tribe/ui-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'niazi-tribe-api',
      cwd: './apps/api',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: '/var/log/niazi-tribe/api-error.log',
      out_file: '/var/log/niazi-tribe/api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'niazi-tribe-matching',
      cwd: './services/matching',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      error_file: '/var/log/niazi-tribe/matching-error.log',
      out_file: '/var/log/niazi-tribe/matching-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'niazi-tribe-gedcom',
      cwd: './services/gedcom',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      error_file: '/var/log/niazi-tribe/gedcom-error.log',
      out_file: '/var/log/niazi-tribe/gedcom-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
}; 