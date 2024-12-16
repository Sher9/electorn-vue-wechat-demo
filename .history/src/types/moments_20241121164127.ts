export interface Moment {
    id: string
    userId: string
    username: string
    avatar: string
    content: string
    images?: string[]
    likes: string[]
    comments: Comment[]
    createdAt: number
  }
  
  export interface Comment {
    id: string
    userId: string
    username: string
    content: string
    createdAt: number
    replyTo?: {
      userId: string
      username: string
    }
  }