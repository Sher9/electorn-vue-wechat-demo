const logger = {
  info(message) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`)
  },
  
  error(message, error) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`)
    if (error) {
      console.error(error)
    }
  }
}

module.exports = logger 