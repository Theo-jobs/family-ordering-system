Vue.component('menu-component', {
    props: {
        categories: {
            type: Array,
            required: true
        },
        activeCategory: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            dishes: [],
            loading: false,
            error: null,
            searchQuery: '',
            transitionName: 'fade',
            previousCategory: null,
            itemQuantities: {} // 存储每个菜品的数量
        };
    },
    computed: {
        filteredDishes() {
            if (!this.searchQuery.trim()) {
                return this.dishes;
            }
            
            const query = this.searchQuery.toLowerCase();
            return this.dishes.filter(dish => 
                dish.name.toLowerCase().includes(query) || 
                (dish.description && dish.description.toLowerCase().includes(query))
            );
        },
        hasResults() {
            return this.filteredDishes.length > 0;
        }
    },
    watch: {
        activeCategory(newCategory, oldCategory) {
            // 设置过渡方向
            this.previousCategory = oldCategory;
            
            // 记录类别在数组中的位置，用于决定过渡方向
            const oldIndex = this.getCategoryIndex(oldCategory);
            const newIndex = this.getCategoryIndex(newCategory);
            
            if (oldIndex < newIndex) {
                this.transitionName = 'slide-left';
            } else {
                this.transitionName = 'slide-right';
            }
            
            // 滚动类别到可见区域
            this.$nextTick(() => {
                this.scrollCategoryIntoView(newCategory);
                this.fetchDishes();
            });
        }
    },
    mounted() {
        this.fetchDishes();
        // 初始滚动到当前类别
        this.$nextTick(() => {
            this.scrollCategoryIntoView(this.activeCategory);
        });
    },
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2 class="mb-0">家庭菜单</h2>
                <button class="btn btn-sm btn-outline-primary" @click="goToAddDish">
                    <i class="bi bi-plus-circle me-1"></i>添加菜品
                </button>
            </div>
            
            <!-- 搜索框 -->
            <div class="search-box mb-3">
                <div class="input-group">
                    <span class="input-group-text bg-white border-end-0">
                        <i class="bi bi-search text-muted"></i>
                    </span>
                    <input 
                        type="text" 
                        class="form-control border-start-0" 
                        placeholder="搜索菜品..." 
                        v-model="searchQuery"
                    >
                    <button 
                        v-if="searchQuery" 
                        class="btn btn-outline-secondary border-start-0" 
                        type="button"
                        @click="searchQuery = ''"
                    >
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            </div>
            
            <!-- 类别选择导航 -->
            <div class="category-nav" ref="categoryNav">
                <div 
                    v-for="category in categories" 
                    :key="category.id"
                    class="category-item" 
                    :class="{ active: activeCategory === category.id }"
                    :ref="'category-'+category.id"
                    @click="changeCategory(category.id)"
                >
                    <i class="bi" :class="getCategoryIcon(category.id)"></i>
                    <span class="ms-1">{{ category.name }}</span>
                </div>
            </div>
            
            <!-- 菜品内容区 - 添加过渡效果 -->
            <transition :name="transitionName" mode="out-in">
                <div :key="activeCategory">
                    <!-- 加载提示 -->
                    <div v-if="loading" class="loading-indicator my-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">加载中...</span>
                        </div>
                    </div>
                    
                    <!-- 错误提示 -->
                    <div v-else-if="error" class="alert alert-danger my-3" role="alert">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        {{ error }}
                        <button class="btn btn-sm btn-outline-danger ms-2" @click="fetchDishes">重试</button>
                    </div>
                    
                    <!-- 搜索无结果 -->
                    <div v-else-if="searchQuery && !hasResults" class="text-center my-5">
                        <i class="bi bi-search text-muted" style="font-size: 2rem;"></i>
                        <p class="mt-3 text-muted">未找到符合"{{ searchQuery }}"的菜品</p>
                        <button class="btn btn-outline-primary mt-2" @click="searchQuery = ''">清除搜索</button>
                    </div>
                    
                    <!-- 无菜品提示 -->
                    <div v-else-if="!searchQuery && dishes.length === 0" class="text-center my-5">
                        <i class="bi bi-basket text-muted" style="font-size: 3rem;"></i>
                        <p class="mt-3">该类别暂无菜品</p>
                        <button class="btn btn-primary mt-2" @click="goToAddDish">
                            <i class="bi bi-plus-circle me-1"></i>添加菜品
                        </button>
                    </div>
                    
                    <!-- 菜品网格 -->
                    <div v-else class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                        <div v-for="dish in filteredDishes" :key="dish.id" class="col">
                            <div class="card dish-card h-100" @click="viewDish(dish.id)">
                                <div class="position-relative">
                                    <img :src="dish.image_path" class="card-img-top" :alt="dish.name" @error="handleImageError($event, dish)">
                                    <div class="dish-price">¥{{ (dish.price || 0).toFixed(2) }}</div>
                                </div>
                                <div class="card-body d-flex flex-column">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <h5 class="card-title mb-0 text-truncate pe-2">{{ dish.name }}</h5>
                                        <div v-if="dish.avg_rating" class="dish-rating">
                                            <i class="bi bi-star-fill"></i>
                                            {{ dish.avg_rating.toFixed(1) }}
                                        </div>
                                    </div>
                                    <p class="card-text text-muted small mb-3 flex-grow-1">{{ dish.description || '暂无描述' }}</p>
                                    <div v-if="dish.latest_review" class="mb-3 small">
                                        <i class="bi bi-chat-quote me-1 text-muted"></i> 
                                        <span class="text-truncate d-inline-block" style="max-width: 100%;">{{ dish.latest_review }}</span>
                                    </div>
                                    
                                    <!-- 购物车数量控制 - 已简化只保留数量控制 -->
                                    <div>
                                        <div class="d-flex justify-content-between align-items-center mt-2">
                                            <div class="quantity-control">
                                                <div class="quantity-btn" @click.stop="decreaseQuantity(dish.id)">
                                                    <i class="bi bi-dash"></i>
                                                </div>
                                                <input type="number" class="quantity-input" :value="getItemQuantity(dish.id)" min="0" 
                                                    @change.stop="updateQuantity(dish.id, $event.target.value)"
                                                    @click.stop>
                                                <div class="quantity-btn" @click.stop="increaseQuantity(dish.id)">
                                                    <i class="bi bi-plus"></i>
                                                </div>
                                            </div>
                                            <div class="text-primary fw-bold">
                                                ¥{{ (dish.price * getItemQuantity(dish.id)).toFixed(2) }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    `,
    methods: {
        changeCategory(categoryId) {
            if (categoryId !== this.activeCategory) {
                this.$emit('change-category', categoryId);
            }
        },
        viewDish(dishId) {
            this.$emit('view-dish', dishId);
        },
        getItemQuantity(dishId) {
            // 检查购物车中是否已有该菜品
            const cartItem = this.$root.cartItems.find(item => item.dish_id === dishId);
            
            // 如果购物车中已有该菜品，使用购物车中的数量
            if (cartItem) {
                // 确保itemQuantities中有该菜品的数量记录
                if (!this.itemQuantities[dishId]) {
                    this.$set(this.itemQuantities, dishId, cartItem.quantity);
                }
                return this.itemQuantities[dishId];
            }
            
            // 如果购物车中没有该菜品，且本地没有数量记录，则设置为0
            if (!this.itemQuantities[dishId]) {
                this.$set(this.itemQuantities, dishId, 0);
            }
            
            return this.itemQuantities[dishId];
        },
        decreaseQuantity(dishId) {
            if (this.itemQuantities[dishId] > 0) {
                this.itemQuantities[dishId]--;
                
                // 找到当前菜品
                const dish = this.dishes.find(d => d.id === dishId);
                if (dish) {
                    // 直接更新购物车
                    this.updateCartDirectly(dish, this.itemQuantities[dishId]);
                }
            }
        },
        increaseQuantity(dishId) {
            if (!this.itemQuantities[dishId]) {
                this.$set(this.itemQuantities, dishId, 1);
            } else {
                this.itemQuantities[dishId]++;
            }
            
            // 找到当前菜品
            const dish = this.dishes.find(d => d.id === dishId);
            if (dish) {
                // 直接更新购物车
                this.updateCartDirectly(dish, this.itemQuantities[dishId]);
            }
        },
        updateQuantity(dishId, value) {
            const quantity = parseInt(value);
            if (isNaN(quantity) || quantity < 0) {
                this.$set(this.itemQuantities, dishId, 0);
            } else {
                this.$set(this.itemQuantities, dishId, quantity);
            }
            
            // 找到当前菜品
            const dish = this.dishes.find(d => d.id === dishId);
            if (dish) {
                // 直接更新购物车
                this.updateCartDirectly(dish, this.itemQuantities[dishId]);
            }
        },
        updateCartDirectly(dish, quantity) {
            // 创建购物车项对象
            const cartItem = {
                dish_id: dish.id,
                dish_name: dish.name,
                price: dish.price,
                quantity: quantity,
                image_path: dish.image_path,
                // 添加替换标记，表示我们要替换而不是累加
                replace: true
            };
            
            // 如果数量为0，并且商品已在购物车，则应该移除
            if (quantity === 0) {
                cartItem.remove = true;
            }
            
            // 触发购物车图标抖动动画
            this.triggerCartAnimation();
            
            // 调用父组件的方法更新购物车
            this.$emit('add-to-cart', cartItem);
        },
        triggerCartAnimation() {
            // 获取购物车图标元素（通过$root实例访问DOM）
            const cartNavItem = document.querySelector('.nav-item[class*="cart"]');
            if (cartNavItem) {
                const cartIcon = cartNavItem.querySelector('.nav-icon');
                const cartBadge = cartNavItem.querySelector('.cart-badge');
                
                // 添加抖动动画
                if (cartIcon) {
                    cartIcon.classList.remove('cart-shake');
                    // 触发重绘
                    void cartIcon.offsetWidth;
                    cartIcon.classList.add('cart-shake');
                }
                
                // 添加徽章动画
                if (cartBadge) {
                    cartBadge.classList.remove('badge-pulse');
                    // 触发重绘
                    void cartBadge.offsetWidth;
                    cartBadge.classList.add('badge-pulse');
                }
            }
        },
        goToAddDish() {
            this.$emit('change-tab', 'add-dish');
        },
        fetchDishes() {
            this.loading = true;
            this.error = null;
            
            console.log("获取菜品数据，类别:", this.activeCategory);
            
            // 根据当前选择的类别获取菜品
            axios.get(`/api/dishes/category/${this.activeCategory}`)
                .then(response => {
                    console.log("获取到菜品数据:", response.data);
                    this.dishes = response.data;
                })
                .catch(error => {
                    console.error('获取菜品失败:', error);
                    this.error = '获取菜品信息失败，请稍后再试';
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        handleImageError(event, dish) {
            // 图片加载失败时使用备用图片
            console.log("图片加载失败:", dish.image_path);
            event.target.src = `/static/images/dishes/default-${dish.category || 'hot'}.jpg`;
        },
        getCategoryIcon(categoryId) {
            // 为每个类别返回合适的图标
            const iconMap = {
                'hot': 'bi-fire',
                'cold': 'bi-snow',
                'staple': 'bi-egg-fried',
                'drink': 'bi-cup-straw',
                'coffee': 'bi-cup-hot',
                'dessert': 'bi-cake'
            };
            
            return iconMap[categoryId] || 'bi-grid';
        },
        getCategoryIndex(categoryId) {
            // 获取类别在数组中的索引
            return this.categories.findIndex(c => c.id === categoryId);
        },
        scrollCategoryIntoView(categoryId) {
            // 滚动到当前选中的类别
            const categoryEl = this.$refs[`category-${categoryId}`];
            if (categoryEl && categoryEl[0] && this.$refs.categoryNav) {
                const navEl = this.$refs.categoryNav;
                
                // 计算滚动位置使元素居中
                const navWidth = navEl.offsetWidth;
                const itemWidth = categoryEl[0].offsetWidth;
                const itemLeft = categoryEl[0].offsetLeft;
                
                // 设置滚动位置，使选中的类别尽量居中
                navEl.scrollLeft = itemLeft - (navWidth / 2) + (itemWidth / 2);
            }
        }
    }
});