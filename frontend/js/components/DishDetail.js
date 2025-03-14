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
            loading: false
        };
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
            
            <!-- 菜品信息 -->
            <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h3>{{ dish.name }}</h3>
                    <div v-if="dish.avg_rating" class="rating">
                        <i class="bi bi-star-fill text-warning"></i>
                        {{ dish.avg_rating.toFixed(1) }}
                    </div>
                </div>
                
                <p class="text-muted">{{ dish.description }}</p>
                
                <!-- 原料列表 -->
                <h5>主要原料</h5>
                <p>{{ Array.isArray(dish.ingredients) ? dish.ingredients.join('、') : dish.ingredients }}</p>
                
                <!-- 烹饪步骤 -->
                <h5>做法步骤</h5>
                <ol>
                    <li v-for="(step, index) in (Array.isArray(dish.steps) ? dish.steps : [dish.steps])" :key="index">
                        {{ step }}
                    </li>
                </ol>
            </div>
            
            <!-- 操作按钮 -->
            <div class="d-flex justify-content-between mb-4">
                <!-- 编辑按钮 -->
                <button class="btn btn-outline-primary" @click="editDish">
                    <i class="bi bi-pencil"></i> 编辑信息
                </button>
                
                <!-- 二维码按钮 -->
                <button class="btn btn-outline-secondary" @click="showQrCode = !showQrCode">
                    <i class="bi bi-qr-code"></i> {{ showQrCode ? '隐藏二维码' : '显示二维码' }}
                </button>
            </div>
            
            <!-- 二维码展示 -->
            <div v-if="showQrCode" class="qr-code-container mb-4">
                <img :src="generateQrCode(dish)" class="qr-code">
            </div>
            
            <!-- 加入购物车 -->
            <div class="d-flex align-items-center mb-4">
                <div class="quantity-control me-3">
                    <div class="quantity-btn" @click="decreaseQuantity">-</div>
                    <input type="number" class="quantity-input" v-model.number="quantity" min="1">
                    <div class="quantity-btn" @click="increaseQuantity">+</div>
                </div>
                <button class="btn btn-primary flex-grow-1" @click="addToCart">
                    <i class="bi bi-cart-plus"></i> 加入购物车
                </button>
            </div>
            
            <!-- 评价区域 -->
            <div class="reviews-section">
                <h4 class="mb-3">顾客评价</h4>
                
                <div v-if="loading" class="text-center my-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">加载中...</span>
                    </div>
                </div>
                
                <div v-else-if="!dish.reviews || dish.reviews.length === 0" class="text-center my-4">
                    <p class="text-muted">暂无评价</p>
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
            
            <!-- 图片查看器 -->
            <div v-if="selectedImage" class="image-viewer" @click="selectedImage = null">
                <div class="image-viewer-content">
                    <img :src="selectedImage" class="full-image">
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            quantity: 1,
            selectedImage: null,
            loading: false,
            showQrCode: false
        };
    },
    methods: {
        goBack() {
            this.$emit('back');
        },
        editDish() {
            this.$emit('edit-dish', this.dish);
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
            // 创建购物车项对象
            const cartItem = {
                dish_id: this.dish.id,
                dish_name: this.dish.name,
                price: this.dish.price,
                quantity: this.quantity,
                image_path: this.dish.image_path
            };
            
            this.$emit('add-to-cart', cartItem);
        },
        formatDate(dateString) {
            const date = new Date(dateString);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        },
        showImage(imagePath) {
            this.selectedImage = imagePath;
        },
        generateQrCode(dish) {
            // 这里生成二维码的逻辑，通常是通过API端点或前端库实现
            return `/api/dishes/${dish.id}/qrcode`;
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
        }
    }
});