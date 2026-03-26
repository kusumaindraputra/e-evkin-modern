module.exports = {
  apps: [{
    name: 'e-evkin-backend',
    cwd: './backend',
    script: 'dist/server.js',
    instances: 2, // Cluster mode: 2 instances for 2GB RAM server
    exec_mode: 'cluster', // Cluster mode for load balancing across instances
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    // Optimized for 2GB RAM server (2 instances x ~200MB each = ~400MB)
    max_memory_restart: '400M',
    min_uptime: '10s',
    max_restarts: 5,
    restart_delay: 3000,

    // Logging configuration
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    time: true,
    merge_logs: true, // Merge logs from all cluster instances into single files

    // Process management
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'dist'],

    // Performance tuning
    kill_timeout: 5000,
    listen_timeout: 8000,
    shutdown_with_message: true,

    // Graceful reload for zero-downtime deploys
    wait_ready: true,

    // Environment-specific settings
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
