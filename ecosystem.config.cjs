module.exports = {
  apps: [
    /**
     * =========================
     * RATE API SERVER
     * =========================
     */
    {
      name: "gold-erp-rate-api",

      cwd: "/home/bkns-software-rates/htdocs/rates.bkns-software.com/app",
      script: "dist/app/api.js",

      exec_mode: "fork",
      instances: 1,

      autorestart: true,
      watch: false,
      node_args: "--enable-source-maps",
      max_memory_restart: "768M",

      env: {
        NODE_ENV: "production",
      },

      error_file: "../logs/rate-api-error.log",
      out_file: "../logs/rate-api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",

      kill_timeout: 10000,
    },

    /**
     * =========================
     * RATE WORKER (BullMQ + Socket)
     * =========================
     */
    {
      name: "gold-erp-rate-worker",

      cwd: "/home/bkns-software-rates/htdocs/rates.bkns-software.com/app",

      script: "dist/app/worker.js",

      exec_mode: "fork",
      instances: 1,
      node_args: "--enable-source-maps",
      autorestart: true,
      watch: false,

      max_memory_restart: "768M",

      env: {
        NODE_ENV: "production",
      },

      error_file: "../logs/rate-worker-error.log",
      out_file: "../logs/rate-worker-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",

      kill_timeout: 10000,
    },
  ],
};
