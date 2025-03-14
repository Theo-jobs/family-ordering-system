Vue.component('review-component', {
    props: {
        dish: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            rating: 5,
            comment: '',
            images: [],
            imagePreview: [],
            stream: null,
            videoElement: null,
            cameraActive: false,
            submitting: false,
            error: ''
        };
    },
    template: `
        <div class="review">
            <!-- 返回按钮 -->
            <div class="back-button" @click="goBack">
                <i class="bi bi-arrow-left"></i>
            </div>
            
            <h2 class="mb-3">评价菜品</h2>
            
            <div class="card mb-4">
                <div class="card-body">
                    <!-- 菜品信息 -->
                    <div class="d-flex mb-4">
                        <img :src="dish.image_path" class="cart-item-img me-3" :alt="dish.name">
                        <div>
                            <h4>{{ dish.name }}</h4>
                            <div class="text-muted">¥{{ dish.price.toFixed(2) }}</div>
                        </div>
                    </div>
                    
                    <form @submit.prevent="saveReview">
                        <!-- 评分 -->
                        <div class="mb-3">
                            <label class="form-label">评分</label>
                            <div class="rating-input">
                                <i v-for="n in 5" :key="n" class="bi" 
                                   :class="n <= rating ? 'bi-star-fill' : 'bi-star'" 
                                   style="font-size: 2rem; color: #ffc107; cursor: pointer;"
                                   @click="rating = n"></i>
                            </div>
                        </div>
                        
                        <!-- 评价内容 -->
                        <div class="mb-3">
                            <label class="form-label">评价内容</label>
                            <textarea class="form-control" v-model="comment" rows="3" placeholder="请分享您对这道菜的看法..."></textarea>
                        </div>
                        
                        <!-- 上传图片 -->
                        <div class="mb-3">
                            <label class="form-label">上传图片(可选)</label>
                            
                            <!-- 图片预览 -->
                            <div v-if="imagePreview.length > 0" class="image-preview-container mb-3">
                                <div class="d-flex flex-wrap gap-2">
                                    <div v-for="(img, index) in imagePreview" :key="index" class="position-relative">
                                        <img :src="img" class="review-image" alt="评价图片">
                                        <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0" 
                                                @click="removeImage(index)">
                                            <i class="bi bi-x"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 相机预览 -->
                            <div v-if="cameraActive" class="camera-container mb-3">
                                <video ref="video" class="camera-preview w-100" autoplay style="height: 300px;"></video>
                                <div class="camera-controls mt-3">
                                    <div class="camera-button" @click="takePhoto">
                                        <div class="camera-inner"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 相机控制按钮 -->
                            <div class="d-flex gap-2">
                                <button type="button" class="btn btn-outline-primary" @click="toggleCamera">
                                    <i class="bi" :class="cameraActive ? 'bi-camera-video-off' : 'bi-camera'"></i>
                                    {{ cameraActive ? '关闭相机' : '打开相机' }}
                                </button>
                                
                                <label class="btn btn-outline-secondary">
                                    <i class="bi bi-image"></i> 从相册选择
                                    <input type="file" class="d-none" accept="image/*" @change="onFileSelected" multiple>
                                </label>
                            </div>
                        </div>
                        
                        <!-- 错误提示 -->
                        <div v-if="error" class="alert alert-danger" role="alert">
                            {{ error }}
                        </div>
                        
                        <!-- 提交按钮 -->
                        <div class="d-flex gap-2 mt-4">
                            <button type="button" class="btn btn-outline-secondary flex-grow-1" @click="goBack">取消</button>
                            <button type="submit" class="btn btn-primary flex-grow-1" :disabled="submitting">
                                <span v-if="submitting">
                                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    提交中...
                                </span>
                                <span v-else>
                                    <i class="bi bi-check-circle"></i> 提交评价
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `,
    methods: {
        goBack() {
            // 关闭相机
            this.stopCamera();
            this.$emit('back');
        },
        toggleCamera() {
            if (this.cameraActive) {
                this.stopCamera();
            } else {
                this.startCamera();
            }
        },
        startCamera() {
            // 检查浏览器支持
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.error = '您的浏览器不支持访问相机，请使用更现代的浏览器或从相册选择图片';
                return;
            }
            
            // 关闭任何现有的相机流
            this.stopCamera();
            
            // 获取视频元素
            this.videoElement = this.$refs.video;
            
            // 请求相机权限
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    this.stream = stream;
                    this.videoElement.srcObject = stream;
                    this.cameraActive = true;
                })
                .catch(err => {
                    console.error('相机访问错误:', err);
                    this.error = '无法访问相机: ' + err.message;
                });
        },
        stopCamera() {
            if (this.stream) {
                this.stream.getTracks().forEach(track => {
                    track.stop();
                });
                this.stream = null;
            }
            
            if (this.videoElement) {
                this.videoElement.srcObject = null;
            }
            
            this.cameraActive = false;
        },
        takePhoto() {
            if (!this.videoElement || !this.cameraActive) return;
            
            // 创建canvas元素以捕获视频帧
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            // 设置canvas尺寸与视频相同
            canvas.width = this.videoElement.videoWidth;
            canvas.height = this.videoElement.videoHeight;
            
            // 将视频帧绘制到canvas
            context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
            
            // 将canvas转换为base64图片数据
            const imageData = canvas.toDataURL('image/jpeg');
            
            // 添加到图片列表
            this.images.push(imageData);
            this.imagePreview.push(imageData);
        },
        onFileSelected(event) {
            const files = event.target.files;
            if (!files || files.length === 0) return;
            
            // 处理每个选择的文件
            Array.from(files).forEach(file => {
                // 验证文件类型
                if (!file.type.match('image.*')) {
                    this.error = '请选择图片文件';
                    return;
                }
                
                // 读取文件为DataURL
                const reader = new FileReader();
                reader.onload = e => {
                    const imageData = e.target.result;
                    this.images.push(imageData);
                    this.imagePreview.push(imageData);
                };
                reader.readAsDataURL(file);
            });
        },
        removeImage(index) {
            this.images.splice(index, 1);
            this.imagePreview.splice(index, 1);
        },
        saveReview() {
            // 验证评价内容
            if (!this.comment.trim()) {
                this.error = '请填写评价内容';
                return;
            }
            
            this.submitting = true;
            this.error = '';
            
            // 准备评价数据
            const reviewData = {
                dish_id: this.dish.id,
                rating: this.rating,
                comment: this.comment,
                images: this.images
            };
            
            // 发送添加评价请求
            axios.post('/api/reviews/', reviewData)
                .then(response => {
                    // 提示成功
                    this.$root.showNotification('评价提交成功', 'success');
                    
                    // 返回订单详情页面
                    this.$emit('save-review', response.data);
                })
                .catch(error => {
                    console.error('提交评价失败:', error);
                    this.error = '提交评价失败: ' + (error.response?.data?.error || '未知错误');
                })
                .finally(() => {
                    this.submitting = false;
                });
        }
    },
    beforeDestroy() {
        // 确保在组件销毁前关闭相机
        this.stopCamera();
    }
});