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
        notificationTimer: null,
        
        // 添加主题切换功能
        activeComponent: 'menu',
        toast: {
            show: false,
            message: '',
            type: 'info'
        }
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
        // 从本地存储加载主题设置
        const savedTheme = localStorage.getItem('app_theme');
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            // 默认设置温暖主题
            this.setTheme('warm');
        }
        
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
        
        // 确保菜品数据更新时正确刷新界面
        this.$on('dish-updated', this.updateDish);
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
            
            // 先从本地获取菜品数据
            if (this.$refs.menuComponent && this.$refs.menuComponent.dishes) {
                const dish = this.$refs.menuComponent.dishes.find(d => d.id == dishId);
                if (dish) {
                    // 确保菜品对象有reviews属性，防止显示错误
                    if (!dish.reviews) {
                        dish.reviews = [];
                    }
                    this.selectedDish = dish;
                    this.activeTab = 'dish-detail';
                    return;
                }
            }
            
            // 如果本地获取失败，尝试从API获取
            this.loading = true;
            axios.get(`/api/dishes/${dishId}`)
                .then(response => {
                    console.log("获取菜品详情成功:", response.data);
                    
                    // 确保菜品对象有reviews属性
                    if (!response.data.reviews) {
                        response.data.reviews = [];
                    }
                    
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
                // 确保保留原有数据中的重要字段，如果更新的数据没有提供这些字段
                this.selectedDish = {
                    ...this.selectedDish,
                    ...updatedDish,
                    // 确保图片路径正确
                    image_path: updatedDish.image_path || this.selectedDish.image_path,
                    // 确保保留reviews数据
                    reviews: this.selectedDish.reviews || []
                };
                
                console.log("更新后的菜品数据:", this.selectedDish);
            }
            
            // 返回菜品详情页
            this.activeTab = 'dish-detail';
            
            // 刷新菜单组件中的数据
            this.$nextTick(() => {
                // 如果有菜单组件引用，则刷新数据
                if (this.$refs.menuComponent) {
                    this.$refs.menuComponent.fetchDishes();
                    console.log("已触发菜单刷新");
                }
            });
        },
        
        // 添加到已点单方法 (app.js)
        addToCart(item) {
            console.log("添加到已点单:", item);
            // 确保菜品ID取到正确的值
            const dishId = item.id || item.dish_id;
            
            // 确保数量是数字类型
            const quantity = parseInt(item.quantity) || 0;
            
            // 检查是否应该从已点单移除（数量为0）
            if (item.remove === true || quantity === 0) {
                // 查找此菜品在已点单中的索引
                const indexToRemove = this.cartItems.findIndex(cartItem => cartItem.dish_id === dishId);
                if (indexToRemove !== -1) {
                    // 从已点单移除
                    this.cartItems.splice(indexToRemove, 1);
                    console.log(`从已点单移除菜品: ${item.dish_name || item.name}`);
                    
                    // 保存已点单数据
                    this.saveCart();
                    
                    // 显示移除提示
                    this.showAddToCartToast(item.name || item.dish_name, 0, true, false, true);
                    
                    return;
                }
            }
            
            // 检查已点单中是否已有该菜品
            const existingIndex = this.cartItems.findIndex(cartItem => cartItem.dish_id === dishId);
            const isExisting = existingIndex !== -1;
            
            if (isExisting) {
                // 如果item有replace标记，则替换已点单项目数量
                if (item.replace === true) {
                    this.cartItems[existingIndex].quantity = quantity;
                    console.log("替换已点单项数量:", this.cartItems[existingIndex]);
                } else {
                    // 否则累加数量
                    this.cartItems[existingIndex].quantity += quantity;
                    console.log("增加现有已点单项数量:", this.cartItems[existingIndex]);
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
                message = `已从已点单移除"${dishName}"`;
            } else if (isExisting) {
                icon.className = 'bi bi-check-circle';
                if (isReplace) {
                    message = `已将"${dishName}"数量更新为${quantity}`;
                } else {
                    message = `已将"${dishName}"数量+${quantity}`;
                }
            } else {
                icon.className = 'bi bi-cart-plus';
                message = `已添加"${dishName}" ×${quantity}到已点单`;
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
            this.showNotification('已从已点单移除', 'info');
        },
        
        // 清空购物车
        clearCart() {
            this.cartItems = [];
            this.saveCart();
            this.showNotification('已点单已清空', 'info');
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
                console.log("已点单已保存到本地存储, 项目数:", validatedCart.length);
            } catch (e) {
                console.error('保存已点单数据失败:', e);
            }
        },
        
        // 从本地存储加载已点单
        loadCart() {
            try {
                const savedCart = localStorage.getItem('cart');
                if (savedCart) {
                    const parsedCart = JSON.parse(savedCart);
                    
                    // 验证和修复已点单数据
                    this.cartItems = parsedCart.map(item => ({
                        ...item,
                        quantity: parseInt(item.quantity) || 1, // 确保数量是有效的整数
                        price: parseFloat(item.price) || 0 // 确保价格是有效的数字
                    }));
                    
                    console.log("从本地存储加载已点单, 项目数:", this.cartItems.length);
                } else {
                    this.cartItems = [];
                }
            } catch (e) {
                console.error('加载已点单数据失败:', e);
                this.cartItems = [];
            }
        },
        
        // 结算已点单
        checkout(orderData) {
            // 清空已点单
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
            console.log("接收到新添加的菜品数据:", dishData);
            
            // 显示成功通知
            this.showNotification('菜品添加成功', 'success');
            
            // 切换到菜单页面
            this.activeTab = 'menu';
            
            // 刷新菜单数据
            this.$nextTick(() => {
                if (this.$refs.menuComponent) {
                    // 强制刷新菜单数据
                    this.$refs.menuComponent.fetchDishes();
                    console.log("已触发菜单刷新");
                } else {
                    console.warn("无法找到菜单组件引用");
                }
            });
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
        },
        
        // 设置主题
        setTheme(theme) {
            // 移除所有主题类
            document.body.classList.remove('theme-warm', 'theme-cool');
            
            // 添加新主题类
            if (theme === 'warm' || theme === 'cool') {
                document.body.classList.add(`theme-${theme}`);
                
                // 保存到本地存储
                localStorage.setItem('app_theme', theme);
                
                // 更新根元素颜色变量
                const root = document.documentElement;
                
                if (theme === 'warm') {
                    // 温暖主题颜色
                    root.style.setProperty('--primary-color', '#ff8a65');
                    root.style.setProperty('--secondary-color', '#78a4c5');
                    root.style.setProperty('--accent-color', '#fdac63');
                    root.style.setProperty('--background-color', '#f8f5f2');
                } else {
                    // 清凉主题颜色
                    root.style.setProperty('--primary-color', '#64b5f6');
                    root.style.setProperty('--secondary-color', '#4fc3f7');
                    root.style.setProperty('--accent-color', '#81d4fa');
                    root.style.setProperty('--background-color', '#f5f9ff');
                }
            }
        },
        
        // 切换主题
        toggleTheme() {
            const newTheme = this.theme === 'warm' ? 'cool' : 'warm';
            this.setTheme(newTheme);
        }
    }
});