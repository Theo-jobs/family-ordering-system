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
            loading: true,
            showQrCode: false,
            isDeleting: false,
            showQrCodeFullscreen: false,
            showImagePreview: false,
            showQuantityModal: false,
            showReviewImagePreview: false,
            selectedReviewImage: null,
            error: null
        };
    },
    created() {
        // 检查购物车中是否已有该菜品
        const cartItem = this.$root.cartItems.find(item => item.dish_id === this.dish.id);
        
        // 如果购物车中已有此菜品，则使用购物车中的数量
        if (cartItem) {
            this.quantity = cartItem.quantity;
        }
        
        // 数据初始化
        this.initDishData();
        
        // 获取菜品评价
        this.fetchReviews();
        
        console.log("菜品详情组件创建完成:", this.dish.name);
    },
    computed: {
        // 使用静态收款码图片
        qrCodeUrl() {
            return "/static/images/微信收款码.jpg";
        },
        
        // 获取原料列表
        ingredientsList() {
            if (!this.dish.ingredients) return [];
            
            if (typeof this.dish.ingredients === 'string') {
                return this.dish.ingredients
                    .split(',')
                    .map(item => item.trim())
                    .filter(item => item);
            }
            
            return Array.isArray(this.dish.ingredients) ? this.dish.ingredients : [];
        },
        
        // 获取分类名称
        categoryName() {
            if (!this.dish.category) return '未分类';
            return typeof this.dish.category === 'object' ? this.dish.category.name : this.dish.category;
        },
        
        // 获取烹饪步骤
        displaySteps() {
            try {
                console.log('开始处理烹饪步骤，原始数据:', {
                    cooking_steps: this.dish.cooking_steps,
                    steps: this.dish.steps
                });
                
                // 初始化一个空数组来存储步骤
                let steps = [];
                
                // 优先使用结构化的cooking_steps
                if (this.dish.cooking_steps) {
                    let cookingSteps = this.dish.cooking_steps;
                    
                    // 如果是字符串，尝试解析JSON
                    if (typeof cookingSteps === 'string') {
                        try {
                            cookingSteps = JSON.parse(cookingSteps);
                            console.log('成功解析cooking_steps JSON为对象:', cookingSteps);
                        } catch (e) {
                            console.warn('解析cooking_steps JSON失败，尝试按行拆分', e);
                            // 按行拆分成步骤，并添加序号
                            return cookingSteps.split('\n')
                                .filter(step => step.trim())
                                .map((step, index) => ({ 
                                    description: step.trim(),
                                    order: index + 1 
                                }));
                        }
                    }
                    
                    // 如果是数组，确保每个步骤有description和order属性
                    if (Array.isArray(cookingSteps)) {
                        console.log('cooking_steps是数组，长度:', cookingSteps.length);
                        steps = cookingSteps.map((step, index) => {
                            // 如果步骤是字符串，转换为对象
                            if (typeof step === 'string') {
                                return { 
                                    description: step.trim(),
                                    order: index + 1
                                };
                            }
                            // 确保步骤对象有description属性，并分配正确的order属性
                            return { 
                                description: step.description || step.toString(),
                                order: index + 1 // 强制设置order属性为按顺序递增的数字
                            };
                        });
                    }
                }
                
                // 如果没有cooking_steps但有steps，则使用steps
                if (steps.length === 0 && this.dish.steps) {
                    let dishSteps = this.dish.steps;
                    console.log('使用steps字段作为备选，原始数据:', dishSteps);
                    
                    // 如果steps是字符串，按行拆分
                    if (typeof dishSteps === 'string') {
                        steps = dishSteps.split('\n')
                            .filter(step => step.trim())
                            .map((step, index) => ({
                                description: step.trim(),
                                order: index + 1
                            }));
                    } else if (Array.isArray(dishSteps)) {
                        steps = dishSteps.map((step, index) => {
                            if (typeof step === 'string') {
                                return {
                                    description: step.trim(),
                                    order: index + 1
                                };
                            }
                            return {
                                description: step.description || step.toString(),
                                order: index + 1
                            };
                        });
                    }
                }
                
                // 确保步骤已排序且有递增序号
                steps.sort((a, b) => a.order - b.order);
                steps.forEach((step, index) => {
                    step.order = index + 1;
                });
                
                console.log('最终处理后的烹饪步骤:', steps);
                return steps;
            } catch (error) {
                console.error('处理烹饪步骤时出错:', error);
                return [];
            }
        },
        formattedIngredients() {
            if (Array.isArray(this.dish.ingredients)) {
                return this.dish.ingredients;
            } else if (typeof this.dish.ingredients === 'string') {
                return this.dish.ingredients.split(',').map(item => item.trim());
            }
            return [];
        },
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
            <div class="dish-detail-header">
                <div class="back-button" @click="goBack">
                    <i class="bi bi-arrow-left"></i> 返回
                </div>
                <h1 class="dish-title">{{ dish.name }}</h1>
            </div>
            
            <div class="dish-detail-container">
                <div class="dish-detail-content">
                    <div class="dish-main-content">
                        <div class="dish-image-container" v-if="dish.image_path">
                            <img :src="dish.image_path" alt="菜品图片" class="dish-image" @error="handleImageError">
                        </div>
                        <div class="dish-image-placeholder" v-else>
                            <i class="bi bi-image"></i>
                            <span>暂无图片</span>
                        </div>
                    </div>
                    
                    <div class="dish-detail-section">
                        <h3 class="section-title">菜品描述</h3>
                        <p class="dish-description">{{ dish.description || '暂无描述' }}</p>
                    </div>
                    
                    <div class="dish-detail-section ingredients-section">
                        <h3 class="section-title">原材料</h3>
                        <div class="ingredients-container">
                            <span class="ingredient-tag float-effect" v-for="ingredient in ingredientsList">
                                {{ ingredient }}
                            </span>
                        </div>
                    </div>
                    
                    <div class="dish-detail-section">
                        <h3 class="section-title">烹饪步骤</h3>
                        <div class="cooking-steps-container">
                            <!-- 步骤为空时显示提示 -->
                            <div v-if="!displaySteps.length" class="cooking-steps-empty">
                                <i class="bi bi-exclamation-circle"></i>
                                <p>暂无烹饪步骤</p>
                            </div>
                            
                            <!-- 显示步骤列表 -->
                            <div v-else class="cooking-steps-list">
                                <div 
                                    v-for="(step, index) in displaySteps" 
                                    :key="'step-' + index"
                                    class="cooking-step-item"
                                >
                                    <div class="step-badge">{{ step.order }}</div>
                                    <div class="step-content">{{ step.description }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="dish-detail-footer">
                        <div class="dish-price">
                            <span class="price-label">成本:</span>
                            <span class="price-value">¥{{ dish.price }}</span>
                        </div>
                        <div class="dish-category">
                            <span class="category-label">分类:</span>
                            <span class="category-value">{{ categoryName }}</span>
                        </div>
                    </div>
                </div>
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
            
            <!-- 加入已点单 -->
            <div class="card">
                <div class="card-header bg-light">
                    <h5 class="mb-0"><i class="bi bi-chat-square-quote me-2"></i>顾客评价</h5>
                </div>
                
                <div class="card-body">
                    <div v-if="loading" class="text-center my-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">加载中...</span>
                        </div>
                        <p class="mt-2 text-muted">加载评价中...</p>
                    </div>
                    
                    <div v-else-if="error" class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        {{ error }}
                    </div>
                    
                    <div v-else-if="!dish.reviews || dish.reviews.length === 0" class="text-center my-4">
                        <i class="bi bi-chat-square text-muted" style="font-size: 2rem;"></i>
                        <p class="mt-3 text-muted">暂无评价</p>
                    </div>
                    
                    <div v-else>
                        <div v-for="review in dish.reviews" :key="review.id || review.timestamp" class="review-item mb-4 pb-3 border-bottom">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div class="fw-bold">{{ review.user_name || '匿名用户' }}</div>
                                <div class="text-muted small">{{ formatDate(review.timestamp) }}</div>
                            </div>
                            <div class="review-rating mb-2">
                                <i v-for="n in 5" :key="n" class="bi" 
                                   :class="n <= review.rating ? 'bi-star-fill' : 'bi-star'" 
                                   style="color: #ffc107;"></i>
                            </div>
                            <div class="review-comment my-2">
                                {{ review.comment || '该用户没有留下评论' }}
                            </div>
                            <div v-if="review.image_paths && review.image_paths.length > 0" class="review-images mt-2">
                                <img 
                                    v-for="(imgPath, imgIndex) in review.image_paths" 
                                    :key="imgIndex" 
                                    :src="imgPath" 
                                    class="review-image" 
                                    @click="showReviewImage(imgPath)"
                                    @error="handleReviewImageError"
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 底部固定价格栏 -->
            <div class="dish-price-footer">
                <div class="price-display">
                    <span class="price-label">成本价格：</span>
                    <span class="price-value">¥{{ dish.price }}</span>
                </div>
            </div>
            
            <!-- 浮动的圆形点单按钮 -->
            <div class="floating-cart-btn" @click="openQuantityModal">
                <i class="bi bi-cart-plus"></i>
            </div>
            
            <!-- 数量选择弹窗 -->
            <div class="quantity-modal" v-if="showQuantityModal" @click.self="showQuantityModal = false">
                <div class="quantity-modal-content">
                    <h5 class="mb-3">添加到购物车</h5>
                    
                    <div class="d-flex align-items-center justify-content-center mb-3">
                        <button class="btn btn-outline-secondary rounded-circle" @click="decreaseQuantity">
                            <i class="bi bi-dash"></i>
                        </button>
                        <span class="mx-4 quantity-display">{{ quantity }}</span>
                        <button class="btn btn-outline-secondary rounded-circle" @click="increaseQuantity">
                            <i class="bi bi-plus"></i>
                        </button>
                    </div>
                    
                    <div class="d-flex justify-content-between mt-4">
                        <button class="btn btn-outline-secondary" @click="showQuantityModal = false">
                            取消
                        </button>
                        <button class="btn btn-primary" @click="addToCartAndClose">
                            <i class="bi bi-cart-plus me-1"></i> 加入购物车
                        </button>
                    </div>
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
            
            <!-- 图片预览模态框 -->
            <div v-if="showImagePreview" class="image-preview-modal" @click="toggleImagePreview">
                <div class="image-preview-content" @click.stop>
                    <img 
                        :src="dish.image_path" 
                        :alt="dish.name" 
                        class="preview-image"
                    >
                    <button class="close-preview" @click="toggleImagePreview">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>
            
            <!-- 评价图片预览模态框 -->
            <div v-if="showReviewImagePreview" class="review-image-preview" @click="closeReviewImagePreview($event)">
                <div class="review-image-preview-content" @click.stop>
                    <img 
                        :src="selectedReviewImage" 
                        alt="评价图片" 
                    >
                    <button class="close-review-preview" @click="closeReviewImagePreview($event)">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>
        </div>
    `,
    methods: {
        // 初始化菜品数据
        initDishData() {
            // 确保评价数据存在
            if (!this.dish.reviews) {
                this.$set(this.dish, 'reviews', []);
            }
            
            // 处理烹饪步骤数据
            try {
                // 如果cookingSteps不存在或不是数组，初始化为空数组
                if (!this.dish.cookingSteps) {
                    this.$set(this.dish, 'cookingSteps', []);
                } else if (typeof this.dish.cookingSteps === 'string') {
                    // 如果cookingSteps是字符串，尝试解析为JSON或转换为步骤数组
                    try {
                        const parsed = JSON.parse(this.dish.cookingSteps);
                        this.$set(this.dish, 'cookingSteps', Array.isArray(parsed) ? parsed : []);
                    } catch (e) {
                        // 解析失败，按行分割成步骤
                        const steps = this.dish.cookingSteps.split('\n')
                            .filter(step => step.trim() !== '')
                            .map(step => ({ description: step.trim() }));
                        this.$set(this.dish, 'cookingSteps', steps);
                    }
                } else if (Array.isArray(this.dish.cookingSteps)) {
                    // 如果已经是数组，确保每个步骤都是正确的对象格式
                    const formattedSteps = this.dish.cookingSteps.map(step => {
                        if (typeof step === 'string') {
                            return { description: step };
                        } else if (typeof step === 'object' && step !== null && step.description) {
                            return step;
                        } else {
                            return { description: String(step || '') };
                        }
                    });
                    this.$set(this.dish, 'cookingSteps', formattedSteps);
                }
                
                // 处理常规步骤数据
                if (!this.dish.steps) {
                    this.$set(this.dish, 'steps', []);
                } else if (typeof this.dish.steps === 'string') {
                    const steps = this.dish.steps.split('\n')
                        .filter(step => step.trim() !== '');
                    this.$set(this.dish, 'steps', steps);
                } else if (!Array.isArray(this.dish.steps)) {
                    this.$set(this.dish, 'steps', []);
                }
            } catch (error) {
                console.error("处理步骤数据出错:", error);
                // 确保即使出错也有默认值
                this.$set(this.dish, 'cookingSteps', []);
                this.$set(this.dish, 'steps', []);
            }
            
            // 延时加载效果完成
            setTimeout(() => {
                this.loading = false;
            }, 300);
        },
        // 添加获取评价的方法
        fetchReviews() {
            console.log("获取菜品评价:", this.dish.id);
            // 确保reviews是一个数组，即使是空数组
            if (!this.dish.reviews) {
                this.$set(this.dish, 'reviews', []);
            }
            
            // 从服务器获取评价数据
            this.loading = true;
            fetch(`/api/reviews/dish/${this.dish.id}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('获取评价失败');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("获取到评价数据:", data);
                    // 使用$set确保Vue能检测到数据变化
                    this.$set(this.dish, 'reviews', data);
                    this.loading = false;
                })
                .catch(error => {
                    console.error("获取评价出错:", error);
                    this.error = error.message;
                    this.loading = false;
                });
        },
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
            const button = document.querySelector('.floating-cart-btn');
            if (button) {
                button.classList.add('add-to-cart-animation');
                setTimeout(() => {
                    button.classList.remove('add-to-cart-animation');
                }, 500);
            }
            
            // 创建已点单项对象，确保包含quantity
            const cartItem = {
                dish_id: this.dish.id,
                dish_name: this.dish.name,
                price: this.dish.price,
                quantity: this.quantity, // 使用用户选择的数量
                image_path: this.dish.image_path
            };
            
            // 判断已点单中是否已有该菜品
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
            
            // 显示添加成功提示
            this.$root.showNotification(`已添加 ${this.quantity} 份 ${this.dish.name} 到购物车`, 'success');
        },
        formatDate(dateString) {
            if (!dateString) return '未知';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '未知';
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        },
        showImage(imagePath) {
            this.selectedImage = imagePath;
            // 显示图片查看器
            this.showImagePreview = true;
        },
        showReviewImage(imagePath) {
            this.selectedReviewImage = imagePath;
            this.showReviewImagePreview = true;
        },
        closeReviewImagePreview(event) {
            this.showReviewImagePreview = false;
            this.selectedReviewImage = null; // 同时清空图片路径，避免再次点击时问题
            
            // 阻止事件冒泡，确保只触发一次
            if (event) {
                event.stopPropagation();
            }
        },
        handleImageError(event) {
            // 图片加载失败时使用备用图片
            console.log("菜品图片加载失败:", this.dish.image_path);
            const categoryId = this.dish.categoryId || 'hot';
            const defaultImagePath = `/static/images/dishes/default-${categoryId}.jpg`;
            event.target.src = defaultImagePath;
            
            // 如果默认图片也加载失败，使用内嵌的base64图片
            event.target.onerror = function() {
                // 一个小巧的餐盘图标base64编码
                const fallbackImage = 'data:image/png;base64,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';
                event.target.src = fallbackImage;
            };
        },
        handleReviewImageError(event) {
            // 评价图片加载失败时使用备用图片
            console.log("评价图片加载失败");
            event.target.onerror = null; // 防止无限循环
            event.target.src = "/static/images/reviews/default-review.jpg";
            // 如果默认图片也加载失败，使用内联base64小图标
            event.target.onerror = function() {
                event.target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNjY2NjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ij48L2NpcmNsZT48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIj48L3BvbHlsaW5lPjwvc3ZnPg==";
            };
        },
        toggleImagePreview() {
            this.showImagePreview = !this.showImagePreview;
        },
        openQuantityModal() {
            this.showQuantityModal = true;
        },
        addToCartAndClose() {
            this.addToCart();
            this.showQuantityModal = false;
        }
    }
});