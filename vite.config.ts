import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'


export default defineConfig(({ mode }) => {
    const isElectron = mode === 'electron'
    return {
        // 设置scss的api类型为modern-compiler       
        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern-compiler'
                }
            }
        },
        plugins: [
            vue(),
            ...(isElectron ? [
                electron([
                    {
                        entry: 'electron/main.ts',
                        vite: {
                            build: {
                                outDir: 'dist-electron',
                                rollupOptions: {
                                    external: ['electron', 'path']
                                }
                            }
                        }
                    }
                ]),
                renderer()
            ] : []),
            AutoImport({
                resolvers: [ElementPlusResolver()],
                imports: ['vue', 'vue-router', 'pinia'],
                dts: 'src/types/auto-imports.d.ts',
                eslintrc: {
                    enabled: true
                }
            }),
            Components({
                resolvers: [ElementPlusResolver()],
                dts: 'src/types/components.d.ts'
            })
        ],
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src')
            }
        },
        server: {
            port: 3000,
            host: '0.0.0.0', // 监听所有接口
            proxy: {
                '/api': {
                    target: 'http://localhost:8080',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api/, '')
                },
                '/ws': {
                    target: 'ws://localhost:8080',
                    ws: true
                }
            }
        },
        base: './',
        build: {
            outDir: 'dist',
            assetsDir: 'assets',
            emptyOutDir: true,
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['vue', 'vue-router', 'pinia', 'element-plus']
                    }
                }
            }
        }
    }

}) 