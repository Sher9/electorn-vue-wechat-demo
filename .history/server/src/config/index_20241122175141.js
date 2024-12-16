module.exports = {
  // 数据源配置: 'mock' 或 'mysql'
  DATA_SOURCE: process.env.DATA_SOURCE || 'mock',

  // 数据库配置
  DB: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_DATABASE || 'wechat_db'
  },


  // 上传限制配置
  UPLOAD_LIMITS: {
    IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    EMOJI_SIZE: 2 * 1024 * 1024  // 2MB
  },

  // JWT配置
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key',
  TOKEN_EXPIRES_IN: '7d',

  // 服务器配置
  PORT: process.env.PORT || 8080,
  CORS_ORIGIN: process.env.NODE_ENV === 'production'
    ? 'https://your-domain.com'
    : 'http://localhost:3000',
  STATIC_URL: process.env.NODE_ENV === 'production'
    ? 'https://api.example.com'
    : `http://localhost:${process.env.PORT || 8080}`
}