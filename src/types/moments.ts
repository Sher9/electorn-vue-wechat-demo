export interface Moment {
  id: string
  userId: string
  username: string
  avatar: string
  content: string
  images: string[]
  likes: Like[]
  comments: Comment[]
  createdAt: string
  showCommentInput: boolean
}
export interface replyMoment {
  id: string
  showCommentInput: boolean
  newComment: string
  replyTo?: {
    id: string
    username: string
  }
}


export interface Like {
  id: string
  userId: string
  username: string
  avatar: string
  createdAt: string
}

export interface Comment {
  id: string
  userId: string
  username: string
  avatar: string
  content: string
  replyTo?: {
    userId: string
    username: string
  }
  createdAt: string
}