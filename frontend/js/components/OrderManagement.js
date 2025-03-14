Vue.component('order-management', {
    props: {
        orders: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            loading: false
        };
    },
    computed: {
        hasOrders() {
            return this.orders && this.orders.length > 0;
        }
    },
    template: `
        <div class="order-management">
            <h2 class="mb-3">订单管理</h2>
            
            <!-- 加载提示 -->
            <div v-if="loading" class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
            </div>
            
            <!-- 无订单提示 -->
            <div v-else-if="!hasOrders" class="text-center my-5">
                <i class="bi bi-receipt text-muted" style="font-size: 3rem;"></i>
                <p class="mt-3">暂无订单记录</p>
                <button class="btn btn-outline-primary mt-2" @click="goToMenu">去点餐</button>
            </div>
            
            <!-- 订单列表 -->
            <div v-else>
                <div v-for="order in orders" :key="order.id" class="card order-card" @click="viewOrder(order.id)">
                    <div class="order-header">
                        <div>
                            <span class="order-id">订单号: {{ formatOrderId(order.id) }}</span>
                            <span class="order-status" :class="getStatusClass(order.status)">
                                {{ getStatusText(order.status) }}
                            </span>
                        </div>
                        <div class="order-date">{{ formatDate(order.timestamp) }}</div>
                    </div>
                    
                    <div class="order-items">
                        <div v-for="(item, itemIndex) in order.items" :key="itemIndex" class="d-flex justify-content-between mb-2">
                            <div>
                                {{ item.dish_name }} x{{ item.quantity }}
                            </div>
                            <div>¥{{ (item.price * item.quantity).toFixed(2) }}</div>
                        </div>
                    </div>
                    
                    <div class="order-total">
                        合计: ¥{{ order.total_price.toFixed(2) }}
                    </div>
                </div>
            </div>
        </div>
    `,
    methods: {
        goToMenu() {
            this.$emit('change-tab', 'menu');
        },
        viewOrder(orderId) {
            this.$emit('view-order', orderId);
        },
        formatOrderId(id) {
            // 截取ID的前8位作为简短订单号
            return id.substring(0, 8).toUpperCase();
        },
        formatDate(dateString) {
            const date = new Date(dateString);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        },
        getStatusText(status) {
            const statusMap = {
                'pending': '待处理',
                'cooking': '制作中',
                'ready': '可取餐',
                'completed': '已完成',
                'cancelled': '已取消'
            };
            return statusMap[status] || status;
        },
        getStatusClass(status) {
            return `status-${status}`;
        }
    }
});