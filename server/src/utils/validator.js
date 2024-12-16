const validator = {
  isValidUsername(username) {
    return typeof username === 'string' && username.length >= 2 && username.length <= 20
  },

  isValidPassword(password) {
    return typeof password === 'string' && password.length >= 6 && password.length <= 20
  },

  isValidMessage(message) {
    return (
      message &&
      typeof message.content === 'string' &&
      message.content.length > 0 &&
      message.content.length <= 1000
    )
  },

  isValidGroupName(name) {
    return typeof name === 'string' && name.length >= 2 && name.length <= 20
  },

  isValidMemberIds(memberIds) {
    return Array.isArray(memberIds) && memberIds.length > 0 && memberIds.length <= 100
  }
}

module.exports = validator 