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