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
            previousCategory: null
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
                dish.description.toLowerCase().includes(query)
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
                                    <button 
                                        class="btn btn-sm btn-primary w-100 btn-add-to-cart" 
                                        @click.stop="addToCart(dish)" 
                                        :id="'add-cart-btn-'+dish.id">
                                        <i class="bi bi-cart-plus me-1"></i> 加入购物车
                                    </button>
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
        addToCart(dish) {
            // 添加按钮动画
            const button = document.getElementById('add-cart-btn-'+dish.id);
            if (button) {
                button.classList.add('add-to-cart-animation');
                setTimeout(() => {
                    button.classList.remove('add-to-cart-animation');
                }, 500);
            }
            
            // 默认添加1份
            const itemToAdd = {
                ...dish,
                quantity: 1
            };
            this.$emit('add-to-cart', itemToAdd);
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