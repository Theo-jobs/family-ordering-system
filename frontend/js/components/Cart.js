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
            submitting: false
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
        }
    },
    template: `
        <div class="cart">
            <h2 class="mb-3">购物车</h2>
            
            <!-- 空购物车提示 -->
            <div v-if="isEmpty" class="text-center my-5">
                <i class="bi bi-cart text-muted" style="font-size: 3rem;"></i>
                <p class="mt-3">购物车是空的</p>
                <button class="btn btn-outline-primary mt-2" @click="goToMenu">去点餐</button>
            </div>
            
            <!-- 购物车内容 -->
            <div v-else>
                <!-- 购物车项目列表 -->
                <div class="card mb-3">
                    <div class="list-group list-group-flush">
                        <div v-for="(item, index) in cartItems" :key="index" class="list-group-item cart-item">
                            <img :src="item.image_path" class="cart-item-img" :alt="item.dish_name">
                            <div class="cart-item-info">
                                <h5 class="mb-1">{{ item.dish_name }}</h5>
                                <div class="cart-item-price mb-2">¥{{ item.price.toFixed(2) }}</div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <div class="quantity-control">
                                        <div class="quantity-btn" @click="decreaseQuantity(index)">-</div>
                                        <input type="number" class="quantity-input" v-model.number="item.quantity" min="1" @change="updateQuantity(index, item.quantity)">
                                        <div class="quantity-btn" @click="increaseQuantity(index)">+</div>
                                    </div>
                                    <button class="btn btn-outline-danger btn-sm" @click="removeItem(index)">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 订单备注 -->
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">订单备注</h5>
                        <textarea 
                            class="form-control" 
                            v-model="note" 
                            placeholder="有什么特殊要求可以在这里告诉我们" 
                            rows="2"></textarea>
                    </div>
                </div>
                
                <!-- 总价与结算按钮 -->
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span>总价:</span>
                            <span class="fs-4 fw-bold text-danger">¥{{ totalPrice.toFixed(2) }}</span>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-secondary flex-grow-1" @click="clearCart">
                                清空购物车
                            </button>
                            <button class="btn btn-primary flex-grow-1" :disabled="submitting" @click="checkout">
                                <span v-if="submitting">
                                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    提交中...
                                </span>
                                <span v-else>
                                    <i class="bi bi-clipboard-check"></i> 去下单
                                </span>
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
                    alert('下单失败，请稍后再试');
                })
                .finally(() => {
                    this.submitting = false;
                });
        }
    }
});