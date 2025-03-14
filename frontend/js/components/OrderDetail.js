Vue.component('order-detail', {
    props: {
        order: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            loading: false,
            updatingStatus: false,
            newStatus: '',
            selectedImage: null,
            deletingReviewId: null,
            isDeleting: false,
            showQrCodeFullscreen: false,
            reviews: {} // 存储每个菜品的评价
        };
    },
    computed: {
        statusOptions() {
            return [
                { value: 'pending', text: '待处理' },
                { value: 'cooking', text: '制作中' },
                { value: 'ready', text: '可取餐' },
                { value: 'completed', text: '已完成' },
                { value: 'cancelled', text: '已取消' }
            ];
        },
        canReview() {
            // 只有已完成的订单可以评价
            return this.order.status === 'completed';
        },
        // 使用静态收款码图片
        qrCodeUrl() {
            return "/static/images/微信收款码.jpg";
        }
    },
    mounted() {
        // 组件挂载时获取每个菜品的评价
        this.fetchAllReviews();
    },
    template: `
        <div class="order-detail">
            <!-- 返回按钮 -->
            <div class="back-button" @click="goBack">
                <i class="bi bi-arrow-left"></i>
            </div>
            
            <h2 class="mb-3">订单详情</h2>
            
            <!-- 订单基本信息 -->
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row mb-2">
                        <div class="col-4">订单号:</div>
                        <div class="col-8">{{ formatOrderId(order.id) }}</div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-4">下单时间:</div>
                        <div class="col-8">{{ formatDate(order.timestamp) }}</div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-4">订单状态:</div>
                        <div class="col-8">
                            <span class="order-status" :class="getStatusClass(order.status)">
                                {{ getStatusText(order.status) }}
                            </span>
                        </div>
                    </div>
                    <div v-if="order.note" class="row mb-2">
                        <div class="col-4">备注:</div>
                        <div class="col-8">{{ order.note }}</div>
                    </div>
                </div>
            </div>
            
            <!-- 微信收款码 -->
            <div class="card mb-3">
                <div class="card-body text-center">
                    <h5 class="card-title mb-3">扫码支付</h5>
                    <div class="qr-code-container" @click="showQrCodeFullscreen = true" style="cursor: pointer;">
                        <img :src="qrCodeUrl" alt="微信支付" style="max-width: 200px; border: 1px solid #eee; border-radius: 4px;">
                        <div class="mt-2 text-muted small">
                            <i class="bi bi-zoom-in me-1"></i>点击二维码放大
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 订单菜品列表 -->
            <div class="card mb-3">
                <div class="card-header">
                    <h5 class="mb-0">订单菜品</h5>
                </div>
                <div class="list-group list-group-flush">
                    <div v-for="(item, index) in order.items" :key="index" class="list-group-item p-3">
                        <div class="d-flex">
                            <img :src="item.image_path" class="cart-item-img me-3" :alt="item.dish_name">
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between">
                                    <h5 class="mb-1">{{ item.dish_name }}</h5>
                                    <div>
                                        <span class="badge bg-light text-dark">x{{ item.quantity }}</span>
                                    </div>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <div class="text-muted">单价: ¥{{ item.price.toFixed(2) }}</div>
                                    <div class="cart-item-price">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
                                </div>
                                
                                <!-- 评价系统 -->
                                <div class="mt-3 border-top pt-3">
                                    <!-- 已有评价显示 -->
                                    <div v-if="hasReview(item.dish_id)" class="review-display">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div>
                                                <div class="mb-1">
                                                    <i v-for="n in 5" :key="n" class="bi" 
                                                    :class="n <= getReview(item.dish_id).rating ? 'bi-star-fill' : 'bi-star'" 
                                                    style="color: #ffc107;"></i>
                                                </div>
                                                <p class="mb-2">{{ getReview(item.dish_id).comment }}</p>
                                                
                                                <!-- 评价图片 -->
                                                <div v-if="getReview(item.dish_id).image_paths && getReview(item.dish_id).image_paths.length > 0" class="review-images">
                                                    <img 
                                                        v-for="(imgPath, imgIndex) in getReview(item.dish_id).image_paths" 
                                                        :key="imgIndex" 
                                                        :src="imgPath" 
                                                        class="review-image" 
                                                        @click="showImage(imgPath)"
                                                        @error="handleReviewImageError"
                                                    >
                                                </div>
                                            </div>
                                            
                                            <!-- 删除评价按钮 -->
                                            <button class="btn btn-sm btn-outline-danger" 
                                                    @click="confirmDeleteReview(getReview(item.dish_id).id)"
                                                    :disabled="deletingReviewId === getReview(item.dish_id).id">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                
                                    <!-- 评价按钮 -->
                                    <div v-else-if="canReview" class="mt-2 text-center">
                                        <button class="btn btn-outline-primary btn-sm" @click="addReview(item.dish_id)">
                                            <i class="bi bi-star me-1"></i> 评价此菜品
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="d-flex justify-content-between fw-bold">
                        <span>总计:</span>
                        <span class="text-danger">¥{{ order.total_price.toFixed(2) }}</span>
                    </div>
                </div>
            </div>
            
            <!-- 管理员操作区 - 更改订单状态 -->
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">订单操作</h5>
                </div>
                <div class="card-body">
                    <div class="row g-2 mb-3">
                        <div class="col-8">
                            <select v-model="newStatus" class="form-select">
                                <option value="">选择新状态</option>
                                <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                                    {{ option.text }}
                                </option>
                            </select>
                        </div>
                        <div class="col-4">
                            <button 
                                class="btn btn-primary w-100" 
                                :disabled="!newStatus || updatingStatus || newStatus === order.status" 
                                @click="updateStatus">
                                <span v-if="updatingStatus">
                                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                </span>
                                <span v-else>更新状态</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- 删除订单按钮 -->
                    <button class="btn btn-outline-danger w-100" @click="confirmDeleteOrder" :disabled="isDeleting">
                        <span v-if="isDeleting">
                            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            删除中...
                        </span>
                        <span v-else>
                            <i class="bi bi-trash me-1"></i> 删除订单
                        </span>
                    </button>
                </div>
            </div>
            
            <!-- 图片查看器 -->
            <div v-if="selectedImage" class="image-viewer" @click="selectedImage = null">
                <div class="image-viewer-content">
                    <img :src="selectedImage" class="full-image">
                </div>
            </div>
            
            <!-- 二维码全屏查看器 -->
            <div v-if="showQrCodeFullscreen" class="image-viewer" @click="showQrCodeFullscreen = false">
                <div class="image-viewer-content text-center">
                    <img :src="qrCodeUrl" style="max-width: 80%; max-height: 80vh;">
                    <div class="mt-3 text-white">
                        <h4>微信扫码支付</h4>
                        <p>点击任意位置关闭</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    methods: {
        goBack() {
            this.$emit('back');
        },
        formatOrderId(id) {
            return id.substring(0, 8).toUpperCase();
        },
        formatDate(dateString) {
            const date = new Date(dateString);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        },
        getStatusText(status) {
            const statusMap = {
                'pending': '待处理',
                'cooking': '制作中',
                'ready': '可取餐',
                'completed': '已完成',
                'cancelled': '已取消'
            };
            return statusMap[status] || status;
        },
        getStatusClass(status) {
            return `status-${status}`;
        },
        updateStatus() {
            if (!this.newStatus || this.newStatus === this.order.status) {
                return;
            }
            
            this.updatingStatus = true;
            
            // 发送更新订单状态请求
            axios.put(`/api/orders/${this.order.id}/status`, { status: this.newStatus })
                .then(response => {
                    // 更新本地订单状态
                    this.order.status = this.newStatus;
                    this.showNotification('状态更新成功', 'success');
                })
                .catch(error => {
                    console.error('更新状态失败:', error);
                    this.showNotification('更新状态失败，请稍后再试', 'error');
                })
                .finally(() => {
                    this.updatingStatus = false;
                    this.newStatus = '';
                });
        },
        addReview(dishId) {
            // 获取菜品信息
            axios.get(`/api/dishes/${dishId}`)
                .then(response => {
                    // 发送评价事件，传递菜品信息
                    this.$emit('add-review', response.data);
                })
                .catch(error => {
                    console.error('获取菜品信息失败:', error);
                    this.showNotification('获取菜品信息失败，请稍后再试', 'error');
                });
        },
        showImage(imagePath) {
            this.selectedImage = imagePath;
        },
        fetchAllReviews() {
            // 获取所有评价
            axios.get('/api/reviews/')
                .then(response => {
                    const allReviews = response.data;
                    
                    // 为每个菜品查找评价
                    this.order.items.forEach(item => {
                        const dishReviews = allReviews.filter(
                            review => review.dish_id === item.dish_id
                        );
                        
                        if (dishReviews.length > 0) {
                            // 获取最新的评价（假设已按时间排序）
                            // 也可以用时间戳比较找出最新的
                            const latestReview = dishReviews.sort((a, b) => 
                                new Date(b.timestamp) - new Date(a.timestamp)
                            )[0];
                            
                            // 存储到本地的评价对象中
                            this.$set(this.reviews, item.dish_id, latestReview);
                        }
                    });
                })
                .catch(error => {
                    console.error('获取评价失败:', error);
                });
        },
        hasReview(dishId) {
            return this.reviews[dishId] !== undefined;
        },
        getReview(dishId) {
            return this.reviews[dishId] || {};
        },
        confirmDeleteReview(reviewId) {
            if (confirm('确定要删除这条评价吗？')) {
                this.deleteReview(reviewId);
            }
        },
        deleteReview(reviewId) {
            this.deletingReviewId = reviewId;
            
            axios.delete(`/api/reviews/${reviewId}`)
                .then(response => {
                    this.showNotification('评价已成功删除', 'success');
                    
                    // 删除本地缓存的评价
                    for (const dishId in this.reviews) {
                        if (this.reviews[dishId].id === reviewId) {
                            this.$delete(this.reviews, dishId);
                            break;
                        }
                    }
                })
                .catch(error => {
                    console.error('删除评价失败:', error);
                    this.showNotification('删除评价失败: ' + (error.response?.data?.error || '未知错误'), 'error');
                })
                .finally(() => {
                    this.deletingReviewId = null;
                });
        },
        confirmDeleteOrder() {
            if (confirm(`确定要删除订单 #${this.formatOrderId(this.order.id)} 吗？此操作不可恢复。`)) {
                this.deleteOrder();
            }
        },
        deleteOrder() {
            if (this.isDeleting) return;
            
            this.isDeleting = true;
            
            axios.delete(`/api/orders/${this.order.id}`)
                .then(response => {
                    this.showNotification('订单已成功删除', 'success');
                    
                    // 刷新订单列表
                    this.$root.fetchOrders();
                    
                    // 返回订单列表并刷新
                    this.$emit('order-deleted', this.order.id);
                    this.$emit('back');
                })
                .catch(error => {
                    console.error('删除订单失败:', error);
                    this.showNotification('删除订单失败: ' + (error.response?.data?.error || '未知错误'), 'error');
                })
                .finally(() => {
                    this.isDeleting = false;
                });
        },
        handleReviewImageError(event) {
            // 评价图片加载失败时使用备用图片
            console.log("评价图片加载失败");
            event.target.src = "/static/images/reviews/default-review.jpg";
        },
        showNotification(message, type) {
            // 调用父组件定义的通知方法
            this.$root.showNotification(message, type);
        }
    }
});