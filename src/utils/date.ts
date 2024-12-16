export const formatDate = (date: Date | number | string): string => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  if (diff < 1000 * 60) {
    return '刚刚'
  } else if (diff < 1000 * 60 * 60) {
    return `${Math.floor(diff / (1000 * 60))}分钟前`
  } else if (diff < 1000 * 60 * 60 * 24) {
    return `${Math.floor(diff / (1000 * 60 * 60))}小时前`
  } else if (diff < 1000 * 60 * 60 * 24 * 30) {
    return `${Math.floor(diff / (1000 * 60 * 60 * 24))}天前`
  } else {
    return d.toLocaleDateString()
  }
}

export const formatTime = (date: Date | number | string): string => {
  const d = new Date(date)
  return d.toLocaleTimeString('zh-CN', { hour12: false })
}


export const formatChatTime = (date: Date | string | number): string => {
  let messageDate: Date
  if (date) {
    messageDate = new Date(date)
  } else {
    messageDate = new Date()
  }

  const now = new Date()

  // 转换为当天0点
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const beforeYesterday = new Date(today)
  beforeYesterday.setDate(beforeYesterday.getDate() - 2)

  // 获取本周一
  const monday = new Date(today)
  monday.setDate(monday.getDate() - monday.getDay() + 1)

  // 如果是今天，显示时分
  if (messageDate >= today) {
    return messageDate.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  // 如果是昨天
  if (messageDate >= yesterday) {
    return '昨天'
  }

  // 如果是前天
  if (messageDate >= beforeYesterday) {
    return '前天'
  }

  // 如果是本周
  if (messageDate >= monday) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[messageDate.getDay()]
  }

  // 其他情况显示年月日
  return messageDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}