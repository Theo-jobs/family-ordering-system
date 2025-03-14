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
    computed: {
        // 计算购物车总商品数（考虑数量）
        cartTotalItems() {
            return this.cartItems.reduce((total, item) => {
                // 确保数量是数字类型
                const quantity = parseInt(item.quantity) || 0;
                return total + quantity;
            }, 0);
        }
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
        
        // 添加页面加载动画
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.loading = false;
            }, 500);
        });
        
        // 添加网络请求拦截器
        axios.interceptors.request.use(config => {
            this.loading = true;
            return config;
        }, error => {
            this.loading = false;
            return Promise.reject(error);
        });
        
        axios.interceptors.response.use(response => {
            this.loading = false;
            return response;
        }, error => {
            this.loading = false;
            return Promise.reject(error);
        });
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
            
            // 如果切换到菜单标签，滚动到顶部
            if (tab === 'menu') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
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
                    
                    // 滚动到顶部
                    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        
        // 处理菜品删除
        handleDishDeleted(dishId) {
            console.log("菜品已删除:", dishId);
            // 如果删除的菜品在当前类别中，刷新菜单
            if (this.$refs.menuComponent) {
                this.$refs.menuComponent.fetchDishes();
            }
        },
        
        // 处理订单删除
        handleOrderDeleted(orderId) {
            console.log("订单已删除:", orderId);
            
            // 从本地订单列表中移除已删除的订单
            if (this.orders && this.orders.length > 0) {
                this.orders = this.orders.filter(order => order.id !== orderId);
            }
            
            // 重置选中的订单
            this.selectedOrder = null;
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
        
        // 添加到购物车方法 (app.js)
        addToCart(item) {
            console.log("添加到购物车:", item);
            // 确保菜品ID取到正确的值
            const dishId = item.id || item.dish_id;
            
            // 确保数量是数字类型
            const quantity = parseInt(item.quantity) || 0;
            
            // 检查是否应该从购物车移除（数量为0）
            if (item.remove === true || quantity === 0) {
                // 查找此菜品在购物车中的索引
                const indexToRemove = this.cartItems.findIndex(cartItem => cartItem.dish_id === dishId);
                if (indexToRemove !== -1) {
                    // 从购物车移除
                    this.cartItems.splice(indexToRemove, 1);
                    console.log(`从购物车移除菜品: ${item.dish_name || item.name}`);
                    
                    // 保存购物车数据
                    this.saveCart();
                    
                    // 显示移除提示
                    this.showAddToCartToast(item.name || item.dish_name, 0, true, false, true);
                    
                    return;
                }
            }
            
            // 检查购物车中是否已有该菜品
            const existingIndex = this.cartItems.findIndex(cartItem => cartItem.dish_id === dishId);
            const isExisting = existingIndex !== -1;
            
            if (isExisting) {
                // 如果item有replace标记，则替换购物车项目数量
                if (item.replace === true) {
                    this.cartItems[existingIndex].quantity = quantity;
                    console.log("替换购物车项数量:", this.cartItems[existingIndex]);
                } else {
                    // 否则累加数量
                    this.cartItems[existingIndex].quantity += quantity;
                    console.log("增加现有购物车项数量:", this.cartItems[existingIndex]);
                }
            } else if (quantity > 0) { // 只有数量大于0时才添加新项目
                // 添加新项目
                const newItem = {
                    dish_id: dishId,
                    dish_name: item.name || item.dish_name,
                    price: item.price,
                    quantity: quantity,
                    image_path: item.image_path
                };
                
                this.cartItems.push(newItem);
                console.log("添加新购物车项:", newItem);
            }
            
            // 保存购物车数据到本地存储
            this.saveCart();
            
            // 显示自定义添加成功提示
            this.showAddToCartToast(item.name || item.dish_name, quantity, isExisting, item.replace);
            
            // 触发购物车图标抖动动画
            this.animateCartIcon();
            
            // 如果在菜品详情页，返回菜单页
            if (this.activeTab === 'dish-detail') {
                setTimeout(() => {
                    this.activeTab = 'menu';
                }, 500); // 添加短暂延迟，让用户能看到添加动画
            }
        },

        // 显示添加到购物车的提示
        showAddToCartToast(dishName, quantity, isExisting, isReplace, isRemove = false) {
            // 移除任何现有的提示
            const existingToast = document.querySelector('.add-to-cart-toast');
            if (existingToast) {
                document.body.removeChild(existingToast);
            }
            
            // 如果用户只是设置数量为0，不显示提示
            if (quantity === 0 && !isRemove) {
                return;
            }
            
            // 创建提示元素
            const toast = document.createElement('div');
            toast.className = 'add-to-cart-toast';
            
            // 设置提示内容
            const icon = document.createElement('i');
            
            let message;
            if (isRemove) {
                icon.className = 'bi bi-cart-dash';
                toast.classList.add('bg-warning');
                message = `已从购物车移除"${dishName}"`;
            } else if (isExisting) {
                icon.className = 'bi bi-check-circle';
                if (isReplace) {
                    message = `已将"${dishName}"数量更新为${quantity}`;
                } else {
                    message = `已将"${dishName}"数量+${quantity}`;
                }
            } else {
                icon.className = 'bi bi-cart-plus';
                message = `已添加"${dishName}" ×${quantity}到购物车`;
            }
            
            toast.appendChild(icon);
            const text = document.createTextNode(' ' + message);
            toast.appendChild(text);
            
            // 添加到文档并设置自动移除
            document.body.appendChild(toast);
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 2300);
        },

        // 购物车图标抖动动画
        animateCartIcon() {
            // 获取购物车图标元素
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
            try {
                // 确保每个购物车项的数量都是数字类型
                const validatedCart = this.cartItems.map(item => ({
                    ...item,
                    quantity: parseInt(item.quantity) || 1 // 确保数量是有效的整数
                }));
                
                localStorage.setItem('cart', JSON.stringify(validatedCart));
                console.log("购物车已保存到本地存储, 项目数:", validatedCart.length);
            } catch (e) {
                console.error('保存购物车数据失败:', e);
            }
        },
        
        // 从本地存储加载购物车
        loadCart() {
            try {
                const savedCart = localStorage.getItem('cart');
                if (savedCart) {
                    const parsedCart = JSON.parse(savedCart);
                    
                    // 验证和修复购物车数据
                    this.cartItems = parsedCart.map(item => ({
                        ...item,
                        quantity: parseInt(item.quantity) || 1, // 确保数量是有效的整数
                        price: parseFloat(item.price) || 0 // 确保价格是有效的数字
                    }));
                    
                    console.log("从本地存储加载购物车, 项目数:", this.cartItems.length);
                } else {
                    this.cartItems = [];
                }
            } catch (e) {
                console.error('加载购物车数据失败:', e);
                this.cartItems = [];
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
            
            axios.get('/api/orders/')
                .then(response => {
                    this.orders = response.data;
                    console.log("获取订单成功, 数量:", this.orders.length);
                })
                .catch(error => {
                    console.error('获取订单失败:', error);
                    this.showNotification('获取订单失败，请稍后再试', 'error');
                });
        },
        
        // 查看订单详情
        viewOrder(orderId) {
            console.log("查看订单详情:", orderId);
            
            axios.get(`/api/orders/${orderId}`)
                .then(response => {
                    this.selectedOrder = response.data;
                    this.activeTab = 'order-detail';
                    
                    // 滚动到顶部
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                })
                .catch(error => {
                    console.error('获取订单详情失败:', error);
                    this.showNotification('获取订单详情失败，请稍后再试', 'error');
                });
        },
        
        // 刷新订单详情（在评价删除后）
        refreshOrderDetail() {
            if (this.selectedOrder) {
                this.viewOrder(this.selectedOrder.id);
            }
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
            
            // 返回订单详情页并刷新数据
            this.activeTab = 'order-detail';
            this.refreshOrderDetail();
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
        },
        
        // 获取通知图标
        getNotificationIcon(type) {
            const iconMap = {
                'success': 'bi-check-circle-fill',
                'error': 'bi-exclamation-circle-fill',
                'warning': 'bi-exclamation-triangle-fill',
                'info': 'bi-info-circle-fill'
            };
            return iconMap[type] || 'bi-bell-fill';
        }
    }
});