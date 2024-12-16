const { errorResponse } = require('../utils')

// 验证必填字段
const required = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => {
      const value = req.body[field] || req.query[field] || req.params[field]
      return value === undefined || value === ''
    })

    if (missing.length > 0) {
      return res.status(400).json(
        errorResponse(`Missing required fields: ${missing.join(', ')}`, 400)
      )
    }

    next()
  }
}

// 验证字段类型
const validateType = (field, type) => {
  return (req, res, next) => {
    const value = req.body[field] || req.query[field] || req.params[field]
    
    if (value !== undefined) {
      let valid = false
      
      switch (type) {
        case 'string':
          valid = typeof value === 'string'
          break
        case 'number':
          valid = !isNaN(Number(value))
          break
        case 'boolean':
          valid = typeof value === 'boolean'
          break
        case 'array':
          valid = Array.isArray(value)
          break
      }

      if (!valid) {
        return res.status(400).json(
          errorResponse(`Field ${field} must be type ${type}`, 400)
        )
      }
    }

    next()
  }
}

module.exports = {
  required,
  validateType
} 