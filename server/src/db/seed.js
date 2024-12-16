const fs = require('fs')
const path = require('path')
const pool = require('../config/db')

async function seedDatabase() {
  try {
    // 读取SQL文件
    const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8')
    
    // 按语句分割
    const statements = sql.split(';').filter(stmt => stmt.trim())
    
    // 执行每条SQL语句
    for (let statement of statements) {
      if (statement.trim()) {
        await pool.query(statement)
        console.log('Executed:', statement.substring(0, 50) + '...')
      }
    }
    
    console.log('Database seeded successfully')
  } catch (error) {
    console.error('Database seeding failed:', error)
  } finally {
    // 关闭连接池
    await pool.end()
  }
}

// 执行数据填充
seedDatabase()