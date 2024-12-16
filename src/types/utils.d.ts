// 递归 Partial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// 递归 Required
type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

// 递归 Readonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// 排除 null 和 undefined
type NonNullable<T> = T extends null | undefined ? never : T

// 提取 Promise 返回值类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

// 提取函数返回值类型
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any

// 提取构造函数的实例类型
type InstanceType<T extends new (...args: any) => any> = T extends new (...args: any) => infer R ? R : any 