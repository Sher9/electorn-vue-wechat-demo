/**
 * 统一响应工具类
 */
class ResponseUtil {
    /**
     * 成功响应
     * @param {any} data 响应数据
     * @param {string} msg 响应消息
     * @returns {object} 响应对象
     */
    static success(data = null, msg = 'success') {
        return {
            code: 200,
            msg,
            success: true,
            data
        }
    }

    /**
     * 错误响应
     * @param {string} msg 错误消息
     * @param {number} code 错误码
     * @returns {object} 响应对象
     */
    static error(msg = 'error', code = 500) {
        return {
            code,
            msg,
            success: false,
            data: null
        }
    }

    /**
     * 参数错误响应
     * @param {string} msg 错误消息
     * @returns {object} 响应对象
     */
    static badRequest(msg = '参数错误') {
        return this.error(msg, 400)
    }

    /**
     * 未授权响应
     * @param {string} msg 错误消息
     * @returns {object} 响应对象
     */
    static unauthorized(msg = '未授权') {
        return this.error(msg, 401)
    }

    /**
     * 禁止访问响应
     * @param {string} msg 错误消息
     * @returns {object} 响应对象
     */
    static forbidden(msg = '禁止访问') {
        return this.error(msg, 403)
    }

    /**
     * 资源不存在响应
     * @param {string} msg 错误消息
     * @returns {object} 响应对象
     */
    static notFound(msg = '资源不存在') {
        return this.error(msg, 404)
    }

    static validationError(errors) {
        return this.error('参数验证失败', 422, errors)
    }

    static serverError(msg = '服务器内部错误') {
        return this.error(msg, 500)
    }
}

module.exports = ResponseUtil