Vue.component('menu-component', {
    props: {
        categoriesData: {
            type: Array,
            required: true
        },
        activeCategoryId: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            dishes: [],
            categories: [],
            activeCategory: null,
            searchQuery: '',
            loading: false,
            error: null,
            transitionName: 'fade',
            lastCategoryIndex: 0,
            itemQuantities: {} // 存储每个菜品的数量
        };
    },
    computed: {
        filteredDishes() {
            if (!this.dishes) return [];
            
            let result = this.dishes;
            
            // 按类别筛选
            if (this.activeCategory) {
                result = result.filter(dish => {
                    // 兼容处理不同的分类字段
                    const dishCategory = dish.categoryId || dish.category;
                    return dishCategory === this.activeCategory.id;
                });
            }
            
            // 按搜索关键词筛选
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                result = result.filter(dish => 
                    (dish.name && dish.name.toLowerCase().includes(query)) || 
                    (dish.description && dish.description.toLowerCase().includes(query))
                );
            }
            
            return result;
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
        console.log("Menu组件mounted, activeCategoryId:", this.activeCategoryId);
        
        // 加载菜品和分类数据
        this.fetchCategories();
        
        // 设置组件引用，便于父组件调用
        if (this.$parent.$refs.menuComponent !== this) {
            this.$parent.$refs.menuComponent = this;
        }
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
                <div v-for="category in categories" 
                     :key="category.id" 
                     class="category-item" 
                     :class="{ active: activeCategory && activeCategory.id === category.id }"
                     @click="setActiveCategory(category)">
                    <span class="category-emoji">{{ getCategoryIcon(category.id).emoji }}</span>
                    {{ category.name }}
                </div>
            </div>
            
            <!-- 菜品内容区 - 添加过渡效果 -->
            <transition :name="transitionName">
                <div v-if="!loading" class="dishes-container">
                    <div v-if="filteredDishes.length === 0" class="no-dishes">
                        <i class="bi bi-emoji-frown"></i>
                        <p>没有找到符合条件的菜品</p>
                    </div>
                    <div v-else class="dishes-grid">
                        <div v-for="dish in filteredDishes" :key="dish.id" class="col">
                            <div class="card dish-card h-100" @click="viewDish(dish.id)">
                                <div class="position-relative">
                                    <img :src="dish.image_path" class="card-img-top dish-card-img" :alt="dish.name" @error="handleImageError($event, dish)">
                                    <div class="dish-cost">¥{{ (dish.price || 0).toFixed(2) }}</div>
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
                                    <div v-if="dish.latest_review" class="dish-latest-review small">
                                        <i class="bi bi-chat-quote me-1 text-muted"></i> 
                                        <span class="text-truncate d-inline-block" style="max-width: 85%;">{{ dish.latest_review }}</span>
                                        <img v-if="dish.review_image" :src="dish.review_image" class="dish-latest-review-image" 
                                             @error="handleReviewImageError">
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
            <div v-if="loading" class="loading-container">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
            </div>
        </div>
    `,
    methods: {
        setActiveCategory(category) {
            // 确定过渡方向
            const newIndex = this.getCategoryIndex(category);
            const oldIndex = this.getCategoryIndex(this.activeCategory);
            
            if (newIndex > oldIndex) {
                this.transitionName = 'slide-left';
            } else if (newIndex < oldIndex) {
                this.transitionName = 'slide-right';
            } else {
                this.transitionName = 'fade';
            }
            
            this.lastCategoryIndex = oldIndex;
            this.activeCategory = category;
            this.scrollCategoryIntoView();
            
            // 添加延迟以确保过渡效果完成
            this.loading = true;
            setTimeout(() => {
                this.loading = false;
            }, 100);
            
            // 通知父组件类别已更改
            this.$emit('change-category', category.id);
        },
        viewDish(dishId) {
            this.$emit('view-dish', dishId);
        },
        getItemQuantity(dishId) {
            // 检查已点单中是否已有该菜品
            const cartItem = this.$root.cartItems.find(item => item.dish_id === dishId);
            
            // 如果已点单中已有该菜品，使用已点单中的数量
            if (cartItem) {
                // 确保itemQuantities中有该菜品的数量记录
                if (!this.itemQuantities[dishId]) {
                    this.$set(this.itemQuantities, dishId, cartItem.quantity);
                }
                return this.itemQuantities[dishId];
            }
            
            // 如果已点单中没有该菜品，且本地没有数量记录，则设置为0
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
                    // 直接更新已点单
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
                // 直接更新已点单
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
                // 直接更新已点单
                this.updateCartDirectly(dish, this.itemQuantities[dishId]);
            }
        },
        updateCartDirectly(dish, quantity) {
            // 创建已点单项对象
            const cartItem = {
                dish_id: dish.id,
                dish_name: dish.name,
                price: dish.price,
                quantity: quantity,
                image_path: dish.image_path,
                // 添加替换标记，表示我们要替换而不是累加
                replace: true
            };
            
            // 如果数量为0，并且商品已在已点单，则应该移除
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
            console.log("开始获取菜品数据");
            
            let url = '/api/dishes';
            
            // 如果有activeCategory，添加分类过滤参数
            if (this.activeCategory) {
                console.log("根据分类过滤菜品:", this.activeCategory.id);
                url = `/api/dishes?category=${this.activeCategory.id}`;
            }
            
            console.log("请求URL:", url);
            
            // 使用axios替代fetch，与其他组件保持一致
            axios.get(url)
                .then(response => {
                    console.log("从API获取到菜品数据:", response.data);
                    if (response.data && response.data.length > 0) {
                        // 添加categoryId字段以兼容前端逻辑
                        const processedData = response.data.map(dish => {
                            if (dish.category && !dish.categoryId) {
                                dish.categoryId = dish.category;
                            }
                            return dish;
                        });
                        console.log("处理后的菜品数据:", processedData);
                        this.dishes = processedData;
                    } else {
                        console.log("API返回的菜品数据为空");
                        this.dishes = [];
                    }
                })
                .catch(error => {
                    console.error('获取菜品失败:', error);
                    this.error = error.response?.data?.message || '获取菜品数据失败，请稍后再试';
                    // 使用空数组，显示无数据状态
                    this.dishes = [];
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        fetchCategories() {
            // 先使用默认分类数据
            const defaultCategories = [
                { id: 'hot', name: '热菜' },
                { id: 'cold', name: '凉菜' },
                { id: 'staple', name: '主食' },
                { id: 'drink', name: '饮料' },
                { id: 'coffee', name: '咖啡' },
                { id: 'dessert', name: '甜点' }
            ];
            
            console.log("设置默认分类数据");
            // 设置默认分类数据
            this.categories = defaultCategories;
            
            // 处理初始分类
            this.handleInitialCategory();
            
            // 检查后端API是否存在
            fetch('/api/health')
                .then(response => {
                    if (response.ok) {
                        // 如果健康检查成功，才尝试获取分类数据
                        console.log("尝试从API获取分类数据");
                        return fetch('/api/categories');
                    } else {
                        throw new Error('后端API不可用');
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('获取类别失败');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("从API获取到分类数据:", data);
                    if (data && data.length > 0) {
                        this.categories = data;
                        
                        // 重新处理初始分类
                        this.handleInitialCategory();
                    }
                })
                .catch(error => {
                    console.error('获取分类失败:', error.message);
                    // 继续使用默认分类
                });
        },
        
        // 处理初始分类选择
        handleInitialCategory() {
            // 如果有传入的activeCategoryId，尝试找到对应的类别
            if (this.activeCategoryId) {
                console.log("尝试使用props中的activeCategoryId:", this.activeCategoryId);
                const categoryObj = this.categories.find(c => c.id === this.activeCategoryId);
                if (categoryObj) {
                    console.log("找到匹配的分类对象:", categoryObj);
                    this.activeCategory = categoryObj;
                } else {
                    console.log("未找到匹配的分类对象，使用第一个分类");
                    if (this.categories.length > 0) {
                        this.activeCategory = this.categories[0];
                    }
                }
            } else if (!this.activeCategory && this.categories.length > 0) {
                // 如果没有activeCategoryId且没有设置activeCategory，使用第一个分类
                console.log("没有指定分类，使用第一个分类");
                this.activeCategory = this.categories[0];
            }
            
            // 获取菜品
            if (this.activeCategory) {
                this.fetchDishes();
            }
        },
        handleImageError(event, dish) {
            // 图片加载失败时使用备用图片
            console.log("图片加载失败:", dish.image_path);
            const defaultImagePath = `/static/images/dishes/default-${dish.categoryId || 'hot'}.jpg`;
            event.target.src = defaultImagePath;
            
            // 备用方案：如果默认图片也加载失败，使用内嵌的base64图片
            event.target.onerror = function() {
                // 一个小巧的灰色餐盘图标base64编码
                const fallbackImage = 'data:image/png;base64,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';
                event.target.src = fallbackImage;
            };
        },
        handleReviewImageError() {
            // 评价图片加载失败时使用备用图片
            console.log("评价图片加载失败");
            event.target.onerror = null; // 防止无限循环
            event.target.src = "/static/images/reviews/default-review.jpg";
            // 如果默认图片也加载失败，使用内联base64小图标
            event.target.onerror = function() {
                event.target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNjY2NjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ij48L2NpcmNsZT48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIj48L3BvbHlsaW5lPjwvc3ZnPg==";
            };
        },
        getCategoryIcon(categoryId) {
            // 为每个类别返回合适的图标和emoji
            const iconMap = {
                'hot': { icon: 'bi-fire', emoji: '🔥' },
                'cold': { icon: 'bi-snow', emoji: '❄️' },
                'staple': { icon: 'bi-egg-fried', emoji: '🍚' },
                'drink': { icon: 'bi-cup-straw', emoji: '🥤' },
                'coffee': { icon: 'bi-cup-hot', emoji: '☕' },
                'dessert': { icon: 'bi-cake', emoji: '🍰' }
            };
            
            return iconMap[categoryId] || { icon: 'bi-grid', emoji: '📋' };
        },
        getCategoryIndex(category) {
            if (!category) return -1;
            return this.categories.findIndex(c => c.id === category.id);
        },
        scrollCategoryIntoView() {
            if (this.activeCategory) {
                this.$nextTick(() => {
                    const activeEl = this.$el.querySelector('.category-item.active');
                    if (activeEl) {
                        const container = this.$el.querySelector('.category-nav');
                        if (container) {
                            const containerRect = container.getBoundingClientRect();
                            const elRect = activeEl.getBoundingClientRect();
                            
                            // 计算滚动位置，使活动类别居中
                            const scrollLeft = activeEl.offsetLeft - (containerRect.width / 2) + (elRect.width / 2);
                            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                        }
                    }
                });
            }
        }
    }
});