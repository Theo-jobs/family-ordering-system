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
            submitting: false,
            error: '',
            previewImage: null
        };
    },
    template: `
        <div class="review">
            <!-- 返回按钮 -->
            <div class="back-button" @click="goBack">
                <i class="bi bi-arrow-left"></i>
            </div>
            
            <div class="card mb-4">
                <div class="card-header bg-light">
                    <h3 class="mb-0">评价菜品</h3>
                </div>
                <div class="card-body">
                    <!-- 菜品信息 -->
                    <div class="d-flex align-items-center mb-4">
                        <img :src="dish.image_path" class="cart-item-img me-3" :alt="dish.name" @error="handleImageError">
                        <div>
                            <h4 class="mb-1">{{ dish.name }}</h4>
                            <div class="text-muted">¥{{ dish.price.toFixed(2) }}</div>
                        </div>
                    </div>
                    
                    <form @submit.prevent="saveReview">
                        <!-- 评分 -->
                        <div class="mb-4">
                            <label class="form-label fw-bold">您的评分</label>
                            <div class="rating-stars mb-2">
                                <i v-for="n in 5" :key="n" class="bi" 
                                   :class="n <= rating ? 'bi-star-fill' : 'bi-star'" 
                                   style="font-size: 2rem; color: #ffc107; cursor: pointer;"
                                   @click="rating = n"></i>
                            </div>
                            <div class="text-muted small">点击星星进行评分</div>
                        </div>
                        
                        <!-- 评价内容 -->
                        <div class="mb-4">
                            <label class="form-label fw-bold">评价内容</label>
                            <textarea 
                                class="form-control" 
                                v-model="comment" 
                                rows="4" 
                                placeholder="请分享您对这道菜的看法..."
                                required></textarea>
                        </div>
                        
                        <!-- 评价图片上传 -->
                        <div class="mb-4">
                            <label class="form-label fw-bold">添加图片 <span class="text-muted">(可选，最多3张)</span></label>
                            
                            <!-- 图片预览区域 -->
                            <div v-if="imagePreview.length > 0" class="review-images mb-3">
                                <div v-for="(img, index) in imagePreview" :key="index" class="position-relative">
                                    <img :src="img" class="review-image" alt="评价图片"
                                        @click="previewImage = img">
                                    <button type="button" class="btn-close position-absolute top-0 end-0 bg-danger text-white p-1 m-1 rounded-circle" 
                                        @click="removeImage(index)">
                                    </button>
                                </div>
                            </div>
                            
                            <!-- 图片上传按钮 -->
                            <div>
                                <label class="btn btn-outline-primary">
                                    <i class="bi bi-image me-1"></i> 从相册选择
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
                            <button type="button" class="btn btn-outline-secondary flex-grow-1" @click="goBack">
                                <i class="bi bi-x-circle me-1"></i> 取消
                            </button>
                            <button type="submit" class="btn btn-primary flex-grow-1" :disabled="submitting || !comment.trim()">
                                <span v-if="submitting">
                                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    提交中...
                                </span>
                                <span v-else>
                                    <i class="bi bi-check-circle me-1"></i> 提交评价
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- 图片全屏预览 -->
            <div v-if="previewImage" class="review-image-preview" @click="previewImage = null">
                <div class="review-image-preview-content">
                    <img :src="previewImage" alt="评价图片">
                    <button class="close-review-preview" @click.stop="previewImage = null">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>
        </div>
    `,
    methods: {
        goBack() {
            this.$emit('back');
        },
        onFileSelected(event) {
            const files = event.target.files;
            if (!files.length) return;
            
            // 限制最多3张图片
            if (this.images.length + files.length > 3) {
                this.error = '最多只能上传3张图片';
                setTimeout(() => {
                    this.error = '';
                }, 3000);
                return;
            }
            
            // 处理每个文件
            Array.from(files).forEach(file => {
                // 检查文件类型
                if (!file.type.match('image.*')) {
                    this.error = '只能上传图片文件';
                    setTimeout(() => {
                        this.error = '';
                    }, 3000);
                    return;
                }
                
                // 检查文件大小 (限制为2MB)
                if (file.size > 2 * 1024 * 1024) {
                    this.error = '图片大小不能超过2MB';
                    setTimeout(() => {
                        this.error = '';
                    }, 3000);
                    return;
                }
                
                // 创建FileReader读取文件
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageData = e.target.result;
                    this.images.push(imageData);
                    this.imagePreview.push(imageData);
                };
                reader.readAsDataURL(file);
            });
            
            // 清空input，允许重复选择同一文件
            event.target.value = '';
        },
        removeImage(index) {
            this.images.splice(index, 1);
            this.imagePreview.splice(index, 1);
        },
        handleImageError(event) {
            // 菜品图片加载失败时使用备用图片
            event.target.src = `/static/images/dishes/default-${this.dish.category || 'hot'}.jpg`;
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
                order_id: this.dish.order_id,
                rating: this.rating,
                comment: this.comment,
                images: this.images
            };
            
            // 发送添加评价请求
            axios.post('/api/reviews/', reviewData)
                .then(response => {
                    // 提示成功并返回
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
    }
});