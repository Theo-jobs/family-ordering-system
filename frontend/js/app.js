// 定义主Vue应用
new Vue({
    el: '#app',
    data: {
        // 系统状态
        loading: false,
        activeTab: 'menu',
        
        // 菜单相关
        categories: [
            { id: 'hot', name: '热菜' },
            { id: 'cold', name: '凉菜' },
            { id: 'staple', name: '主食' },
            { id: 'drink', name: '饮料' },
            { id: 'coffee', name: '咖啡' },
            { id: 'dessert', name: '甜点' }
        ],
        activeCategory: 'hot',
        
        // 菜品详情
        selectedDish: null,
        
        // 购物车
        cartItems: [],
        
        // 订单
        orders: [],
        selectedOrder: null,
        
        // 评价
        reviewDish: null,
        
        // 通知
        notification: {
            show: false,
            message: '',
            type: 'info'
        },
        
        // 定时器ID
        notificationTimer: null
    },
    created() {
        // 从本地存储加载购物车数据
        this.loadCart();
        
        // 获取订单数据
        this.fetchOrders();
        
        // 添加调试信息
        console.log("Vue应用已创建");
    },
    mounted() {
        console.log("Vue应用已挂载");
        console.log("当前活动标签:", this.activeTab);
        console.log("当前类别:", this.activeCategory);
    },
    methods: {
        // 标签切换
        changeTab(tab) {
            console.log("切换标签到:", tab);
            this.activeTab = tab;
            
            // 如果切换到订单标签，刷新订单数据
            if (tab === 'orders') {
                this.fetchOrders();
            }
        },
        
        // 类别切换
        changeCategory(categoryId) {
            console.log("切换类别到:", categoryId);
            this.activeCategory = categoryId;
        },
        
        // 查看菜品详情
        viewDish(dishId) {
            console.log("查看菜品详情:", dishId);
            this.loading = true;
            
            // 获取菜品详情
            axios.get(`/api/dishes/${dishId}`)
                .then(response => {
                    this.selectedDish = response.data;
                    this.activeTab = 'dish-detail';
                })
                .catch(error => {
                    console.error('获取菜品详情失败:', error);
                    this.showNotification('获取菜品详情失败，请稍后再试', 'error');
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        
        // 编辑菜品
        editDish(dish) {
            console.log("编辑菜品:", dish.id);
            this.selectedDish = dish;
            this.activeTab = 'edit-dish';
        },
        
        // 更新菜品后处理
        updateDish(updatedDish) {
            console.log("菜品已更新:", updatedDish.id);
            
            // 更新本地缓存的菜品数据
            if (this.selectedDish && this.selectedDish.id === updatedDish.id) {
                this.selectedDish = updatedDish;
            }
            
            // 返回菜品详情页
            this.activeTab = 'dish-detail';
            
            // 如果菜品类别变化，需要刷新菜单
            if (updatedDish.category === this.activeCategory) {
                // 刷新当前类别下的菜品列表
                this.$refs.menuComponent && this.$refs.menuComponent.fetchDishes();
            }
        },
        
        // 添加到购物车
        addToCart(item) {
            console.log("添加到购物车:", item);
            // 检查购物车中是否已有该菜品
            const existingIndex = this.cartItems.findIndex(cartItem => cartItem.dish_id === (item.dish_id || item.id));
            
            if (existingIndex !== -1) {
                // 如果已存在，增加数量
                this.cartItems[existingIndex].quantity += item.quantity || 1;
                console.log("增加现有购物车项数量:", this.cartItems[existingIndex]);
            } else {
                // 否则添加新项目
                const newItem = {
                    dish_id: item.id || item.dish_id,
                    dish_name: item.name || item.dish_name,
                    price: item.price,
                    quantity: item.quantity || 1,
                    image_path: item.image_path
                };
                
                this.cartItems.push(newItem);
                console.log("添加新购物车项:", newItem);
            }
            
            // 保存购物车数据到本地存储
            this.saveCart();
            
            // 显示通知
            this.showNotification('已添加到购物车', 'success');
            
            // 如果在菜品详情页，返回菜单页
            if (this.activeTab === 'dish-detail') {
                this.activeTab = 'menu';
            }
        },
        
        // 更新购物车商品数量
        updateCartQuantity(index, quantity) {
            if (quantity < 1) quantity = 1;
            this.cartItems[index].quantity = quantity;
            this.saveCart();
        },
        
        // 从购物车移除商品
        removeFromCart(index) {
            this.cartItems.splice(index, 1);
            this.saveCart();
            this.showNotification('已从购物车移除', 'info');
        },
        
        // 清空购物车
        clearCart() {
            this.cartItems = [];
            this.saveCart();
            this.showNotification('购物车已清空', 'info');
        },
        
        // 保存购物车到本地存储
        saveCart() {
            localStorage.setItem('cart', JSON.stringify(this.cartItems));
            console.log("购物车已保存到本地存储, 项目数:", this.cartItems.length);
        },
        
        // 从本地存储加载购物车
        loadCart() {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                try {
                    this.cartItems = JSON.parse(savedCart);
                    console.log("从本地存储加载购物车, 项目数:", this.cartItems.length);
                } catch (e) {
                    console.error('加载购物车数据失败:', e);
                    this.cartItems = [];
                }
            }
        },
        
        // 结算购物车
        checkout(orderData) {
            // 清空购物车
            this.cartItems = [];
            this.saveCart();
            
            // 显示成功通知
            this.showNotification('订单已提交成功', 'success');
            
            // 更新订单列表
            this.fetchOrders();
            
            // 切换到订单页面
            this.activeTab = 'orders';
        },
        
        // 获取所有订单
        fetchOrders() {
            console.log("获取订单列表");
            this.loading = true;
            
            axios.get('/api/orders/')
                .then(response => {
                    this.orders = response.data;
                    console.log("获取订单成功, 数量:", this.orders.length);
                })
                .catch(error => {
                    console.error('获取订单失败:', error);
                    this.showNotification('获取订单失败，请稍后再试', 'error');
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        
        // 查看订单详情
        viewOrder(orderId) {
            console.log("查看订单详情:", orderId);
            this.loading = true;
            
            axios.get(`/api/orders/${orderId}`)
                .then(response => {
                    this.selectedOrder = response.data;
                    this.activeTab = 'order-detail';
                })
                .catch(error => {
                    console.error('获取订单详情失败:', error);
                    this.showNotification('获取订单详情失败，请稍后再试', 'error');
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        
        // 添加菜品
        saveDish(dishData) {
            // 显示成功通知
            this.showNotification('菜品添加成功', 'success');
            
            // 切换到菜单页面
            this.activeTab = 'menu';
            
            // 如果新菜品与当前类别相同，则刷新菜单
            if (dishData.category === this.activeCategory) {
                // 触发类别变化以刷新菜单
                this.changeCategory(this.activeCategory);
            }
        },
        
        // 显示评价表单
        showReviewForm(dish) {
            this.reviewDish = dish;
            this.activeTab = 'review';
        },
        
        // 保存评价
        saveReview(reviewData) {
            // 显示成功通知
            this.showNotification('评价提交成功', 'success');
            
            // 返回订单详情页
            this.activeTab = 'order-detail';
        },
        
        // 显示通知
        showNotification(message, type = 'info') {
            console.log("显示通知:", message, type);
            // 清除现有通知定时器
            if (this.notificationTimer) {
                clearTimeout(this.notificationTimer);
            }
            
            // 设置新通知
            this.notification = {
                show: true,
                message: message,
                type: type
            };
            
            // 3秒后自动关闭
            this.notificationTimer = setTimeout(() => {
                this.notification.show = false;
            }, 3000);
        }
    }
});
