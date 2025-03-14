// 相机访问辅助函数
const CameraUtils = {
    // 检查相机支持
    checkCameraSupport() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    },
    
    // 获取相机流
    async getCameraStream(options = {}) {
        if (!this.checkCameraSupport()) {
            throw new Error('您的设备不支持相机功能');
        }
        
        // 默认相机选项
        const defaultOptions = {
            video: {
                facingMode: 'environment', // 尝试使用后置相机
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        
        // 合并默认选项和自定义选项
        const streamOptions = Object.assign({}, defaultOptions, options);
        
        try {
            // 尝试获取媒体流
            console.log('请求相机访问权限...', streamOptions);
            return await navigator.mediaDevices.getUserMedia(streamOptions);
        } catch (error) {
            console.error('相机访问失败:', error);
            
            // 如果环境相机失败，尝试任何可用相机
            if (streamOptions.video.facingMode === 'environment') {
                console.log('尝试使用前置相机...');
                return await navigator.mediaDevices.getUserMedia({
                    video: true
                });
            }
            
            throw error;
        }
    },
    
    // 拍照
    takePhoto(videoElement) {
        if (!videoElement) {
            throw new Error('视频元素不存在');
        }
        
        // 创建canvas元素以捕获视频帧
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // 设置canvas尺寸与视频相同
        canvas.width = videoElement.videoWidth || 640;
        canvas.height = videoElement.videoHeight || 480;
        
        // 将视频帧绘制到canvas
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // 将canvas转换为base64图片数据
        return canvas.toDataURL('image/jpeg', 0.8);
    },
    
    // 停止媒体流
    stopStream(stream) {
        if (stream && stream.getTracks) {
            stream.getTracks().forEach(track => {
                track.stop();
            });
        }
    }
};

// 适配iOS的相机组件
Vue.component('ios-camera', {
    props: {
        value: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            stream: null,
            active: false,
            error: '',
            photoTaken: false,
            photoData: '',
            supportsCamera: false,
            isMobileSafari: false
        };
    },
    template: `
    <div class="ios-camera">
        <div v-if="error" class="alert alert-warning">
            {{ error }}
        </div>
        
        <div v-if="!active && !photoTaken" class="camera-buttons">
            <button v-if="supportsCamera" type="button" class="btn btn-primary" @click="startCamera">
                <i class="bi bi-camera"></i> 打开相机
            </button>
            
            <div class="mt-3">
                <label class="btn btn-secondary">
                    <i class="bi bi-image"></i> 从相册选择
                    <input type="file" accept="image/*" @change="onFileSelected" hidden>
                </label>
            </div>
        </div>
        
        <div v-if="active" class="camera-container">
            <video ref="video" class="camera-preview" autoplay playsinline></video>
            
            <div class="camera-controls mt-3">
                <button class="btn btn-danger rounded-circle camera-button" @click="takePhoto">
                    <i class="bi bi-camera"></i>
                </button>
                <button class="btn btn-secondary ml-2" @click="stopCamera">
                    <i class="bi bi-x"></i> 取消
                </button>
            </div>
        </div>
        
        <div v-if="photoTaken" class="photo-container">
            <img :src="photoData" class="photo-preview">
            
            <div class="photo-controls mt-3">
                <button class="btn btn-success" @click="acceptPhoto">
                    <i class="bi bi-check"></i> 使用此照片
                </button>
                <button class="btn btn-secondary ml-2" @click="retakePhoto">
                    <i class="bi bi-arrow-repeat"></i> 重拍
                </button>
            </div>
        </div>
    </div>
    `,
    mounted() {
        // 检测设备和浏览器
        this.supportsCamera = CameraUtils.checkCameraSupport();
        this.isMobileSafari = /iP(ad|hone|od).+Version\/[\d\.]+.*Safari/i.test(navigator.userAgent);
        
        if (!this.supportsCamera) {
            this.error = '您的设备或浏览器不支持相机功能，请选择从相册上传图片';
        }
        
        if (this.isMobileSafari) {
            console.log('检测到iOS Safari浏览器');
        }
    },
    methods: {
        async startCamera() {
            try {
                this.error = '';
                
                // 针对iOS设备的特殊配置
                const options = {
                    video: {
                        facingMode: { exact: "environment" },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };
                
                // iOS Safari特殊处理
                if (this.isMobileSafari) {
                    options.video = true;  // 简化iOS Safari的视频配置
                }
                
                console.log('启动相机...');
                this.stream = await CameraUtils.getCameraStream(options);
                
                this.$nextTick(() => {
                    if (this.$refs.video) {
                        this.$refs.video.srcObject = this.stream;
                        this.$refs.video.play()
                            .then(() => {
                                console.log('视频已播放');
                                this.active = true;
                            })
                            .catch(err => {
                                console.error('视频播放失败:', err);
                                this.error = '无法启动相机预览: ' + err.message;
                            });
                    } else {
                        console.error('视频元素不存在');
                        this.error = '相机组件初始化失败';
                    }
                });
            } catch (error) {
                console.error('相机启动失败:', error);
                this.error = '无法访问相机: ' + error.message + '。请确保已授予相机权限或选择从相册上传。';
                this.stopCamera();
            }
        },
        takePhoto() {
            try {
                if (!this.$refs.video) {
                    throw new Error('相机未正确初始化');
                }
                
                // 拍照
                this.photoData = CameraUtils.takePhoto(this.$refs.video);
                this.photoTaken = true;
                
                // 停止相机流但保留数据
                this.stopCameraOnly();
                
                console.log('照片已拍摄');
            } catch (error) {
                console.error('拍照失败:', error);
                this.error = '拍照失败: ' + error.message;
            }
        },
        stopCamera() {
            // 停止相机流
            CameraUtils.stopStream(this.stream);
            this.stream = null;
            this.active = false;
            this.photoTaken = false;
            this.photoData = '';
        },
        stopCameraOnly() {
            // 只停止相机流，保留照片数据
            CameraUtils.stopStream(this.stream);
            this.stream = null;
            this.active = false;
        },
        retakePhoto() {
            // 丢弃当前照片并重新启动相机
            this.photoTaken = false;
            this.photoData = '';
            this.startCamera();
        },
        acceptPhoto() {
            // 接受当前照片并将其值传递给父组件
            this.$emit('input', this.photoData);
            this.$emit('photo-taken', this.photoData);
        },
        onFileSelected(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (!file.type.match('image.*')) {
                this.error = '请选择图片文件';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                this.photoData = e.target.result;
                this.photoTaken = true;
                
                // 将图片数据传递给父组件
                this.$emit('input', this.photoData);
                this.$emit('photo-taken', this.photoData);
            };
            reader.onerror = () => {
                this.error = '读取图片失败';
            };
            reader.readAsDataURL(file);
        }
    },
    beforeDestroy() {
        // 确保在组件销毁前停止相机流
        this.stopCamera();
    }
});