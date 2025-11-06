module.exports = {
  apps: [{
    name: 'e-evkin-backend',
    cwd: './backend',
    script: 'dist/server.js',
    instances: 1, // Single instance for 2GB RAM server
    exec_mode: 'fork', // Fork mode more efficient for single instance
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    // Optimized for 2GB RAM server
    max_memory_restart: '800M', // Increased but safe for 2GB server
    min_uptime: '10s',
    max_restarts: 5,
    restart_delay: 3000,
    
    // Logging configuration
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    time: true,
    
    // Process management
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'dist'],
    
    // Performance tuning for Ubuntu server
    kill_timeout: 5000,
    listen_timeout: 8000,
    shutdown_with_message: true,
    
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
