Vue.component('cart-component', {
    props: {
        cartItems: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            note: '',
            submitting: false,
            collapseNote: true
        };
    },
    computed: {
        totalPrice() {
            return this.cartItems.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);
        },
        isEmpty() {
            return this.cartItems.length === 0;
        },
        totalItems() {
            return this.cartItems.reduce((count, item) => count + item.quantity, 0);
        }
    },
    template: `
        <div class="cart">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2 class="mb-0">购物车</h2>
                <span v-if="!isEmpty" class="badge bg-primary rounded-pill">{{ totalItems }}件商品</span>
            </div>
            
            <!-- 空购物车提示 -->
            <div v-if="isEmpty" class="text-center my-5 py-5">
                <i class="bi bi-cart text-muted" style="font-size: 3.5rem;"></i>
                <p class="mt-3 text-muted">购物车是空的</p>
                <button class="btn btn-primary mt-3" @click="goToMenu">
                    <i class="bi bi-grid me-1"></i>去点餐
                </button>
            </div>
            
            <!-- 购物车内容 -->
            <div v-else>
                <!-- 购物车项目列表 -->
                <div class="card mb-3">
                    <div class="list-group list-group-flush">
                        <div v-for="(item, index) in cartItems" :key="index" class="list-group-item cart-item">
                            <div class="d-flex">
                                <img :src="item.image_path" class="cart-item-img" :alt="item.dish_name" @error="handleImageError($event, item)">
                                <div class="cart-item-info w-100">
                                    <div class="d-flex justify-content-between align-items-start mb-1">
                                        <h5 class="mb-0">{{ item.dish_name }}</h5>
                                        <button class="btn btn-sm p-0 cart-remove-btn" @click="confirmRemoveItem(index)">
                                            <i class="bi bi-x-circle text-danger"></i>
                                        </button>
                                    </div>
                                    
                                    <div class="text-muted small mb-2">
                                        单价: ¥{{ item.price.toFixed(2) }}
                                    </div>
                                    
                                    <div class="d-flex justify-content-between align-items-center mt-2">
                                        <div class="quantity-control">
                                            <div class="quantity-btn" @click="decreaseQuantity(index)">
                                                <i class="bi bi-dash"></i>
                                            </div>
                                            <input type="number" class="quantity-input" v-model.number="item.quantity" min="1" @change="updateQuantity(index, item.quantity)">
                                            <div class="quantity-btn" @click="increaseQuantity(index)">
                                                <i class="bi bi-plus"></i>
                                            </div>
                                        </div>
                                        <div class="cart-item-price">
                                            ¥{{ (item.price * item.quantity).toFixed(2) }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 订单备注 -->
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center" 
                         @click="collapseNote = !collapseNote" 
                         style="cursor: pointer;">
                        <h5 class="mb-0">
                            <i class="bi bi-pencil-square me-2"></i>订单备注
                        </h5>
                        <i class="bi" :class="collapseNote ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
                    </div>
                    <div class="card-body" v-if="!collapseNote">
                        <textarea 
                            class="form-control" 
                            v-model="note" 
                            placeholder="有什么特殊要求可以在这里告诉我们" 
                            rows="2"></textarea>
                    </div>
                </div>
                
                <!-- 订单总结与结算按钮 -->
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="text-muted">商品总计</span>
                            <span>¥{{ totalPrice.toFixed(2) }}</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="text-muted">配送费</span>
                            <span>免费</span>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="fw-bold">总计:</span>
                            <span class="fs-4 fw-bold text-danger">¥{{ totalPrice.toFixed(2) }}</span>
                        </div>
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary" :disabled="submitting" @click="checkout">
                                <span v-if="submitting">
                                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    提交中...
                                </span>
                                <span v-else>
                                    <i class="bi bi-clipboard-check me-1"></i> 去结算
                                </span>
                            </button>
                            <button class="btn btn-outline-secondary" @click="clearCart">
                                <i class="bi bi-trash me-1"></i> 清空购物车
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    methods: {
        goToMenu() {
            this.$emit('change-tab', 'menu');
        },
        decreaseQuantity(index) {
            if (this.cartItems[index].quantity > 1) {
                this.cartItems[index].quantity--;
                this.updateQuantity(index, this.cartItems[index].quantity);
            }
        },
        increaseQuantity(index) {
            this.cartItems[index].quantity++;
            this.updateQuantity(index, this.cartItems[index].quantity);
        },
        updateQuantity(index, quantity) {
            // 确保数量至少为1
            const newQuantity = Math.max(1, quantity);
            this.$emit('update-quantity', index, newQuantity);
        },
        removeItem(index) {
            this.$emit('remove-item', index);
        },
        clearCart() {
            if (confirm('确定要清空购物车吗？')) {
                this.$emit('clear-cart');
            }
        },
        handleImageError(event, item) {
            // 图片加载失败时使用备用图片
            const categoryFromPath = item.image_path.includes('dishes/default-') 
                ? item.image_path.split('default-')[1].split('.')[0]
                : 'hot';
            event.target.src = `/static/images/dishes/default-${categoryFromPath}.jpg`;
        },
        
        confirmRemoveItem(index) {
            // 使用轻量级确认而非标准confirm
            if (window.confirm(`确定要从购物车移除 ${this.cartItems[index].dish_name} 吗？`)) {
                this.removeItem(index);
            }
        },
        
        removeItem(index) {
            const removedItem = this.cartItems[index];
            this.$emit('remove-item', index);
            
            // 显示移除成功的提示
            this.$root.showNotification(`已从购物车移除 ${removedItem.dish_name}`, 'info');
        },
        checkout() {
            this.submitting = true;
            
            // 准备订单数据
            const orderData = {
                items: this.cartItems.map(item => ({
                    dish_id: item.dish_id,
                    quantity: item.quantity
                })),
                note: this.note
            };
            
            // 发送创建订单请求
            axios.post('/api/orders/', orderData)
                .then(response => {
                    // 订单创建成功
                    this.$emit('checkout', response.data);
                    this.note = '';
                })
                .catch(error => {
                    console.error('下单失败:', error);
                    this.$root.showNotification('下单失败，请稍后再试', 'error');
                })
                .finally(() => {
                    this.submitting = false;
                });
        }
    }
});