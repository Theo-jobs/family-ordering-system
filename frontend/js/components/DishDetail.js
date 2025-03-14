Vue.component('dish-detail', {
    props: {
        dish: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            quantity: 1,
            selectedImage: null,
            loading: false,
            showQrCode: false,
            isDeleting: false,
            showQrCodeFullscreen: false
        };
    },
    created() {
        // 检查购物车中是否已有该菜品
        const cartItem = this.$root.cartItems.find(item => item.dish_id === this.dish.id);
        
        // 如果购物车中已有此菜品，则使用购物车中的数量
        if (cartItem) {
            this.quantity = cartItem.quantity;
        }
    },
    computed: {
        // 使用静态收款码图片
        qrCodeUrl() {
            return "/static/images/微信收款码.jpg";
        },
        // 格式化原料列表
        formattedIngredients() {
            if (Array.isArray(this.dish.ingredients)) {
                return this.dish.ingredients;
            } else if (typeof this.dish.ingredients === 'string') {
                return this.dish.ingredients.split(',').map(item => item.trim());
            }
            return [];
        },
        // 格式化步骤列表
        formattedSteps() {
            if (Array.isArray(this.dish.steps)) {
                return this.dish.steps;
            } else if (typeof this.dish.steps === 'string') {
                return this.dish.steps.split('\n').filter(step => step.trim() !== '');
            }
            return [];
        }
    },
    template: `
        <div class="dish-detail">
            <!-- 返回按钮 -->
            <div class="back-button" @click="goBack">
                <i class="bi bi-arrow-left"></i>
            </div>
            
            <!-- 菜品图片 -->
            <div class="position-relative mb-4">
                <img :src="dish.image_path" class="dish-detail-img w-100" :alt="dish.name" @error="handleImageError">
                <div class="price-tag position-absolute top-0 end-0 m-3 py-1 px-3 bg-warning text-dark rounded-pill">
                    ¥{{ dish.price.toFixed(2) }}
                </div>
            </div>
            
            <!-- 菜品基本信息 -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3 class="mb-0">{{ dish.name }}</h3>
                        <div v-if="dish.avg_rating" class="rating">
                            <i class="bi bi-star-fill text-warning me-1"></i>
                            {{ dish.avg_rating.toFixed(1) }}
                        </div>
                    </div>
                    
                    <p class="text-muted mb-3">{{ dish.description || '暂无描述' }}</p>
                    
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <span class="text-muted">分类：</span>
                            <span class="category-badge px-2 py-1 rounded" :class="'category-'+dish.category">
                                {{ getCategoryName(dish.category) }}
                            </span>
                        </div>
                        <div>
                            <span class="text-muted">上架时间：</span>
                            <span>{{ formatDate(dish.timestamp) }}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 原料列表 -->
            <div class="dish-detail-section">
                <h5><i class="bi bi-basket"></i> 主要原料</h5>
                <div class="ingredients-list">
                    <span v-for="(ingredient, index) in formattedIngredients" :key="index" class="ingredient-tag">
                        {{ ingredient }}
                    </span>
                </div>
            </div>
            
            <!-- 烹饪步骤 -->
            <div class="dish-detail-section">
                <h5><i class="bi bi-list-ol"></i> 做法步骤</h5>
                <ul class="steps-list">
                    <li v-for="(step, index) in formattedSteps" :key="index" class="step-item">
                        {{ step }}
                    </li>
                </ul>
            </div>
            
            <!-- 操作按钮 -->
            <div class="d-flex flex-wrap gap-2 mb-4">
                <!-- 编辑按钮 -->
                <button class="btn btn-outline-primary" @click="editDish">
                    <i class="bi bi-pencil me-1"></i> 编辑信息
                </button>
                
                <!-- 二维码按钮 -->
                <button class="btn btn-outline-secondary" @click="showQrCode = !showQrCode">
                    <i class="bi bi-qr-code me-1"></i> {{ showQrCode ? '隐藏支付码' : '显示支付码' }}
                </button>
                
                <!-- 删除按钮 -->
                <button class="btn btn-outline-danger" @click="confirmDelete">
                    <i class="bi bi-trash me-1"></i> 删除菜品
                </button>
            </div>
            
            <!-- 微信收款码展示 -->
            <div v-if="showQrCode" class="card mb-4">
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
            
            <!-- 加入购物车 -->
            <div class="card dish-actions mb-4">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-7">
                            <div class="d-flex align-items-center">
                                <span class="me-2">数量:</span>
                                <div class="quantity-control">
                                    <div class="quantity-btn" @click="decreaseQuantity">
                                        <i class="bi bi-dash"></i>
                                    </div>
                                    <input type="number" class="quantity-input" v-model.number="quantity" min="1">
                                    <div class="quantity-btn" @click="increaseQuantity">
                                        <i class="bi bi-plus"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-5">
                            <div class="text-end fs-5 text-primary fw-bold">
                                ¥{{ (dish.price * quantity).toFixed(2) }}
                            </div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <button 
                            id="dish-detail-add-cart" 
                            class="btn btn-primary w-100 btn-add-to-cart" 
                            @click="addToCart">
                            <i class="bi bi-cart-plus me-1"></i> 加入购物车
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- 评价区域 -->
            <div class="card">
                <div class="card-header bg-light">
                    <h5 class="mb-0"><i class="bi bi-chat-square-quote me-2"></i>顾客评价</h5>
                </div>
                
                <div class="card-body">
                    <div v-if="loading" class="text-center my-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">加载中...</span>
                        </div>
                    </div>
                    
                    <div v-else-if="!dish.reviews || dish.reviews.length === 0" class="text-center my-4">
                        <i class="bi bi-chat-square text-muted" style="font-size: 2rem;"></i>
                        <p class="mt-3 text-muted">暂无评价</p>
                    </div>
                    
                    <div v-else>
                        <div v-for="review in dish.reviews" :key="review.id" class="review-item">
                            <div class="review-header">
                                <div class="review-user">{{ review.user_name }}</div>
                                <div class="review-date">{{ formatDate(review.timestamp) }}</div>
                            </div>
                            <div class="review-rating">
                                <i v-for="n in 5" :key="n" class="bi" 
                                   :class="n <= review.rating ? 'bi-star-fill' : 'bi-star'" 
                                   style="color: #ffc107;"></i>
                            </div>
                            <div class="review-comment my-2">
                                {{ review.comment }}
                            </div>
                            <div v-if="review.image_paths && review.image_paths.length > 0" class="review-images">
                                <img 
                                    v-for="(imgPath, imgIndex) in review.image_paths" 
                                    :key="imgIndex" 
                                    :src="imgPath" 
                                    class="review-image" 
                                    @click="showImage(imgPath)"
                                    @error="handleReviewImageError"
                                >
                            </div>
                        </div>
                    </div>
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
        editDish() {
            this.$emit('edit-dish', this.dish);
        },
        confirmDelete() {
            if (confirm(`确定要删除"${this.dish.name}"吗？此操作不可恢复。`)) {
                this.deleteDish();
            }
        },
        deleteDish() {
            if (this.isDeleting) return;
            
            this.isDeleting = true;
            
            axios.delete(`/api/dishes/${this.dish.id}`)
                .then(response => {
                    // 显示成功消息
                    this.$root.showNotification('菜品已成功删除', 'success');
                    
                    // 返回菜单页面并刷新
                    this.$emit('dish-deleted', this.dish.id);
                    this.$emit('back');
                })
                .catch(error => {
                    console.error('删除菜品失败:', error);
                    this.$root.showNotification('删除菜品失败: ' + (error.response?.data?.error || '未知错误'), 'error');
                })
                .finally(() => {
                    this.isDeleting = false;
                });
        },
        decreaseQuantity() {
            if (this.quantity > 1) {
                this.quantity--;
            }
        },
        increaseQuantity() {
            this.quantity++;
        },
        addToCart() {
            // 添加按钮动画
            const button = document.getElementById('dish-detail-add-cart');
            if (button) {
                button.classList.add('add-to-cart-animation');
                setTimeout(() => {
                    button.classList.remove('add-to-cart-animation');
                }, 500);
            }
            
            // 创建购物车项对象，确保包含quantity
            const cartItem = {
                dish_id: this.dish.id,
                dish_name: this.dish.name,
                price: this.dish.price,
                quantity: this.quantity, // 使用用户选择的数量
                image_path: this.dish.image_path
            };
            
            // 判断购物车中是否已有该菜品
            const existingItem = this.$root.cartItems.find(item => item.dish_id === this.dish.id);
            
            if (existingItem) {
                // 如果已存在，提供选项让用户选择替换还是累加
                if (confirm(`"${this.dish.name}"已在购物车中(${existingItem.quantity}件)，是否替换数量？\n点击"确定"替换为${this.quantity}件\n点击"取消"则累加数量`)) {
                    // 用户选择替换
                    cartItem.replace = true; // 添加标记告诉父组件替换而不是累加
                } else {
                    // 用户选择累加
                    // 不做额外处理，默认是累加
                }
            }
            
            this.$emit('add-to-cart', cartItem);
        },
        formatDate(dateString) {
            if (!dateString) return '未知';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '未知';
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        },
        showImage(imagePath) {
            this.selectedImage = imagePath;
        },
        handleImageError(event) {
            // 图片加载失败时使用备用图片
            console.log("菜品图片加载失败:", this.dish.image_path);
            event.target.src = `/static/images/dishes/default-${this.dish.category || 'hot'}.jpg`;
        },
        handleReviewImageError(event) {
            // 评价图片加载失败时使用备用图片
            console.log("评价图片加载失败");
            event.target.src = "/static/images/reviews/default-review.jpg";
        },
        getCategoryName(categoryId) {
            const categoryMap = {
                'hot': '热菜',
                'cold': '凉菜',
                'staple': '主食',
                'drink': '饮料',
                'coffee': '咖啡',
                'dessert': '甜点'
            };
            return categoryMap[categoryId] || categoryId;
        }
    }
});