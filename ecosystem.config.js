module.exports = {
  apps: [
    {
      name: 'sicaii-inventory',
      script: 'npm',
      args: 'start',
      cwd: '.', // Directorio actual del proyecto
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      instances: 'max', // Usar todos los cores disponibles
      exec_mode: 'cluster', // Modo cluster para mejor rendimiento
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // Configuración específica para Next.js
      node_args: '--max-old-space-size=1024',
      // Script de pre-start para asegurar que las dependencias estén instaladas
      pre_script: 'npm install --production',
      // Configuración de restart automático
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/OliverHuron/SICAII.git',
      path: '/var/www/sicaii',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --production && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
