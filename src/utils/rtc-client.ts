import { wsClient } from './ws-client'
import { chatApi } from '@/api/chat'

export class RTCClient {
    private static instance: RTCClient | null = null
    private peerConnection: RTCPeerConnection | null = null
    private localStream: MediaStream | null = null
    private remoteStream: MediaStream | null = null
    private currentCallId: string | null = null
    private wsClient: any
    private isVideo: boolean = false
    private isEnding: boolean = false // 添加标志位防止递归
    constructor(wsClient: any) {
        this.wsClient = wsClient
    }

    // 单例模式获取实例
    public static getInstance(): RTCClient {
        if (!RTCClient.instance) {
            RTCClient.instance = new RTCClient(wsClient)  // 传入 wsClient
        }
        return RTCClient.instance
    }

    // 初始化连接
    private async initPeerConnection() {
        // 确保清理旧的连接
        await this.cleanup()

        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: [
                        'stun:stun.l.google.com:19302',
                        'stun:stun1.l.google.com:19302'
                    ]
                }
            ],
            iceCandidatePoolSize: 10
        })

        // 监听ICE候选者
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.currentCallId) {
                wsClient.send({
                    type: 'rtc',
                    data: {
                        type: 'candidate',
                        target: this.currentCallId,
                        candidate: event.candidate
                    }
                })
            }
        }

        // 监听连接状态
        this.peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', this.peerConnection?.connectionState)
            if (this.peerConnection?.connectionState === 'failed') {
                this.endCall()
            }
        }

        // 监听ICE连接状态
        this.peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE Connection state:', this.peerConnection?.iceConnectionState)
            if (this.peerConnection?.iceConnectionState === 'failed') {
                this.endCall()
            }
        }

        // 监听远程流
        this.peerConnection.ontrack = (event) => {
            this.remoteStream = event.streams[0]
            this.onRemoteStream?.(this.remoteStream)
        }
    }

    // 开始通话
    async startCall(targetId: string, receiverId: string, isVideo: boolean = false) {
        try {
            await this.initPeerConnection()
            this.currentCallId = targetId
            this.isVideo = isVideo

            // 获取本地媒体流
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: isVideo
            })

            // 添加本地流到连接
            this.localStream.getTracks().forEach(track => {
                if (this.peerConnection && this.localStream) {
                    this.peerConnection.addTrack(track, this.localStream)
                }
            })

            // 触发本地流回调
            this.onLocalStream?.(this.localStream)

            // 创建并发送offer
            const offer = await this.peerConnection!.createOffer()
            await this.peerConnection!.setLocalDescription(offer)

            // 使用 API 发送信令
            await chatApi.sendCallSignal({
                receiverId,
                type: 'offer',
                sdp: offer,
                isVideo
            })
        } catch (error) {
            console.error('Start call error:', error)
            this.cleanup()
            throw error
        }
    }

    // 接听通话
    async answerCall(callerId: string, offer: RTCSessionDescriptionInit) {
        try {
            await this.initPeerConnection()
            this.currentCallId = callerId

            // 获取本地媒体流
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: this.isVideo
            })

            // 添加本地流到连接
            this.localStream.getTracks().forEach(track => {
                if (this.peerConnection && this.localStream) {
                    this.peerConnection.addTrack(track, this.localStream)
                }
            })

            // 触发本地流回调
            this.onLocalStream?.(this.localStream)

            // 设置远程描述并创建应答
            await this.peerConnection!.setRemoteDescription(offer)
            const answer = await this.peerConnection!.createAnswer()
            await this.peerConnection!.setLocalDescription(answer)

            wsClient.send({
                type: 'rtc',
                data: {
                    type: 'answer',
                    target: callerId,
                    payload: {
                        sdp: answer
                    }
                }
            })
        } catch (error) {
            console.error('Answer call error:', error)
            this.cleanup()
            throw error
        }
    }
    async handleOffer(sdp: RTCSessionDescriptionInit, senderId: string) {
        try {
            if (!this.peerConnection) return;
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            return answer;
        } catch (error) {
            console.error('Handle offer error:', error);
        }
    }

    // 处理应答
    async handleAnswer(answer: RTCSessionDescriptionInit) {
        try {
            await this.peerConnection?.setRemoteDescription(answer)
        } catch (error) {
            console.error('Handle answer error:', error)
            this.cleanup()
            throw error
        }
    }



    // 处理ICE候选者
    async handleCandidate(candidate: RTCIceCandidateInit) {
        try {
            await this.peerConnection?.addIceCandidate(candidate)
        } catch (error) {
            console.error('Handle candidate error:', error)
        }
    }


    cleanup() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop())
            this.localStream = null
        }
        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => track.stop())
            this.remoteStream = null
        }
        if (this.peerConnection) {
            this.peerConnection.close()
            this.peerConnection = null
        }
    }

    endCall() {
        if (this.isEnding) return; // 防止递归调用

        try {
            this.isEnding = true;
            this.cleanup();

            // 发送结束通话信令
            if (this.wsClient) {
                this.wsClient.send({
                    type: 'call',
                    data: {
                        type: 'end'
                    }
                });
            }
        } finally {
            this.isEnding = false;
        }
    }

    // 切换音频
    toggleAudio(enabled: boolean) {
        this.localStream?.getAudioTracks().forEach(track => {
            track.enabled = enabled
        })
    }

    // 切换视频
    toggleVideo(enabled: boolean) {
        this.localStream?.getVideoTracks().forEach(track => {
            track.enabled = enabled
        })
    }

    // 回调函数
    onLocalStream?: (stream: MediaStream) => void
    onRemoteStream?: (stream: MediaStream) => void
    onCallEnded?: () => void
}

// 导出单例实例
export const rtcClient = RTCClient.getInstance()