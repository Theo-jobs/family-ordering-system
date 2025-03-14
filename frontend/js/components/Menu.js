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
            error: null
        };
    },
    template: `
        <div>
            <h2 class="mb-3">家庭菜单</h2>
            
            <!-- 类别选择导航 -->
            <div class="category-nav">
                <div 
                    v-for="category in categories" 
                    :key="category.id"
                    class="category-item" 
                    :class="{ active: activeCategory === category.id }"
                    @click="changeCategory(category.id)">
                    {{ category.name }}
                </div>
            </div>
            
            <!-- 加载提示 -->
            <div v-if="loading" class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
            </div>
            
            <!-- 错误提示 -->
            <div v-else-if="error" class="alert alert-danger my-3" role="alert">
                {{ error }}
                <button class="btn btn-sm btn-outline-danger ms-2" @click="fetchDishes">重试</button>
            </div>
            
            <!-- 菜品网格 -->
            <div v-else class="row">
                <div v-if="dishes.length === 0" class="col-12 text-center my-5">
                    <p>该类别暂无菜品</p>
                    <button class="btn btn-outline-primary mt-2" @click="goToAddDish">添加菜品</button>
                </div>
                
                <div v-for="dish in dishes" :key="dish.id" class="col-md-4 col-sm-6 mb-4">
                    <div class="card dish-card h-100" @click="viewDish(dish.id)">
                        <img :src="dish.image_path" class="card-img-top" :alt="dish.name" @error="handleImageError($event, dish)">
                        <div class="dish-price">¥{{ (dish.price || 0).toFixed(2) }}</div>
                        <div class="card-body">
                            <h5 class="card-title">{{ dish.name }}</h5>
                            <div v-if="dish.avg_rating" class="mb-2">
                                <span class="dish-rating">
                                    <i class="bi bi-star-fill"></i>
                                    {{ dish.avg_rating.toFixed(1) }}
                                </span>
                            </div>
                            <p v-if="dish.latest_review" class="card-text text-muted small">
                                <i class="bi bi-chat-quote"></i> {{ dish.latest_review }}
                            </p>
                        </div>
                        <div class="card-footer bg-white border-top-0">
                            <button class="btn btn-primary btn-sm w-100" @click.stop="addToCart(dish)">
                                <i class="bi bi-cart-plus"></i> 加入购物车
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    mounted() {
        this.fetchDishes();
    },
    methods: {
        changeCategory(categoryId) {
            this.$emit('change-category', categoryId);
        },
        viewDish(dishId) {
            this.$emit('view-dish', dishId);
        },
        addToCart(dish) {
            this.$emit('add-to-cart', dish);
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
        }
    },
    watch: {
        // 当类别变化时重新获取菜品
        activeCategory() {
            this.fetchDishes();
        }
    }
});