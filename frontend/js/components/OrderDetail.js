Vue.component('order-detail', {
    props: {
        order: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            loading: false,
            updatingStatus: false,
            newStatus: ''
        };
    },
    computed: {
        statusOptions() {
            return [
                { value: 'pending', text: '待处理' },
                { value: 'cooking', text: '制作中' },
                { value: 'ready', text: '可取餐' },
                { value: 'completed', text: '已完成' },
                { value: 'cancelled', text: '已取消' }
            ];
        },
        canReview() {
            // 只有已完成的订单可以评价
            return this.order.status === 'completed';
        }
    },
    template: `
        <div class="order-detail">
            <!-- 返回按钮 -->
            <div class="back-button" @click="goBack">
                <i class="bi bi-arrow-left"></i>
            </div>
            
            <h2 class="mb-3">订单详情</h2>
            
            <!-- 订单基本信息 -->
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row mb-2">
                        <div class="col-4">订单号:</div>
                        <div class="col-8">{{ formatOrderId(order.id) }}</div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-4">下单时间:</div>
                        <div class="col-8">{{ formatDate(order.timestamp) }}</div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-4">订单状态:</div>
                        <div class="col-8">
                            <span class="order-status" :class="getStatusClass(order.status)">
                                {{ getStatusText(order.status) }}
                            </span>
                        </div>
                    </div>
                    <div v-if="order.note" class="row mb-2">
                        <div class="col-4">备注:</div>
                        <div class="col-8">{{ order.note }}</div>
                    </div>
                </div>
            </div>
            
            <!-- 订单二维码 -->
            <div v-if="order.qr_code" class="qr-code-container mb-3">
                <img :src="order.qr_code" class="qr-code">
            </div>
            
            <!-- 订单菜品列表 -->
            <div class="card mb-3">
                <div class="card-header">
                    <h5 class="mb-0">订单菜品</h5>
                </div>
                <div class="list-group list-group-flush">
                    <div v-for="(item, index) in order.items" :key="index" class="list-group-item">
                        <div class="d-flex">
                            <img :src="item.image_path" class="cart-item-img me-3" :alt="item.dish_name">
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between">
                                    <h5 class="mb-1">{{ item.dish_name }}</h5>
                                    <span>x{{ item.quantity }}</span>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <div class="text-muted">单价: ¥{{ item.price.toFixed(2) }}</div>
                                    <div class="cart-item-price">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
                                </div>
                                
                                <!-- 评价按钮 -->
                                <div v-if="canReview" class="mt-2 text-end">
                                    <button class="btn btn-outline-primary btn-sm" @click="addReview(item.dish_id)">
                                        <i class="bi bi-star"></i> 评价
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="d-flex justify-content-between fw-bold">
                        <span>总计:</span>
                        <span class="text-danger">¥{{ order.total_price.toFixed(2) }}</span>
                    </div>
                </div>
            </div>
            
            <!-- 管理员操作区 - 更改订单状态 -->
            <div class="card mb-3">
                <div class="card-header">
                    <h5 class="mb-0">更改订单状态</h5>
                </div>
                <div class="card-body">
                    <div class="row g-2">
                        <div class="col-8">
                            <select v-model="newStatus" class="form-select">
                                <option value="">选择新状态</option>
                                <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                                    {{ option.text }}
                                </option>
                            </select>
                        </div>
                        <div class="col-4">
                            <button 
                                class="btn btn-primary w-100" 
                                :disabled="!newStatus || updatingStatus || newStatus === order.status" 
                                @click="updateStatus">
                                <span v-if="updatingStatus">
                                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    更新中...
                                </span>
                                <span v-else>更新状态</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    methods: {
        goBack() {
            this.$emit('back');
        },
        formatOrderId(id) {
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
        },
        updateStatus() {
            if (!this.newStatus || this.newStatus === this.order.status) {
                return;
            }
            
            this.updatingStatus = true;
            
            // 发送更新订单状态请求
            axios.put(`/api/orders/${this.order.id}/status`, { status: this.newStatus })
                .then(response => {
                    // 更新本地订单状态
                    this.order.status = this.newStatus;
                    this.showNotification('状态更新成功', 'success');
                })
                .catch(error => {
                    console.error('更新状态失败:', error);
                    this.showNotification('更新状态失败，请稍后再试', 'error');
                })
                .finally(() => {
                    this.updatingStatus = false;
                    this.newStatus = '';
                });
        },
        addReview(dishId) {
            // 获取菜品信息
            axios.get(`/api/dishes/${dishId}`)
                .then(response => {
                    // 发送评价事件，传递菜品信息
                    this.$emit('add-review', response.data);
                })
                .catch(error => {
                    console.error('获取菜品信息失败:', error);
                    this.showNotification('获取菜品信息失败，请稍后再试', 'error');
                });
        },
        showNotification(message, type) {
            // 调用父组件定义的通知方法
            this.$root.showNotification(message, type);
        }
    }
});