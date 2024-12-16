const pool = require('../config/db')
const { v4: uuidv4 } = require('uuid')

const db = {
  // 基础查询
  async query(sql, params) {
    try {
      const [rows] = await pool.query(sql, params)
      return rows
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  },

  // 事务操作
  async transaction(callback) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      const result = await callback(conn)
      await conn.commit()
      return result
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  },

  // 生成UUID
  generateId() {
    return uuidv4()
  }
}

module.exports = db