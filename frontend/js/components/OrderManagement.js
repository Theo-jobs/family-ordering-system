Vue.component('order-management', {
    props: {
        orders: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            loading: false,
            filterStatus: 'all',
            searchQuery: ''
        };
    },
    computed: {
        hasOrders() {
            return this.orders && this.orders.length > 0;
        },
        filteredOrders() {
            let filtered = this.orders;
            
            // 按状态筛选
            if (this.filterStatus !== 'all') {
                filtered = filtered.filter(order => order.status === this.filterStatus);
            }
            
            // 按搜索词筛选
            if (this.searchQuery.trim()) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(order => {
                    // 搜索订单ID
                    if (order.id.toLowerCase().includes(query)) {
                        return true;
                    }
                    
                    // 搜索菜品名称
                    return order.items.some(item => 
                        item.dish_name.toLowerCase().includes(query)
                    );
                });
            }
            
            return filtered;
        },
        statusCounts() {
            const counts = {
                all: this.orders.length,
                pending: 0,
                cooking: 0,
                ready: 0,
                completed: 0,
                cancelled: 0
            };
            
            this.orders.forEach(order => {
                if (counts.hasOwnProperty(order.status)) {
                    counts[order.status]++;
                }
            });
            
            return counts;
        }
    },
    template: `
        <div class="order-management">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2 class="mb-0">订单管理</h2>
                <button class="btn btn-sm btn-outline-primary" @click="refreshOrders">
                    <i class="bi bi-arrow-clockwise me-1"></i>刷新
                </button>
            </div>
            
            <!-- 状态过滤器 -->
            <div class="status-tabs mb-3 overflow-auto">
                <div class="d-flex">
                    <div class="filter-tab" :class="{ active: filterStatus === 'all' }" @click="filterStatus = 'all'">
                        <span class="filter-name">全部</span>
                        <span class="filter-count">{{ statusCounts.all }}</span>
                    </div>
                    <div class="filter-tab" :class="{ active: filterStatus === 'pending' }" @click="filterStatus = 'pending'">
                        <span class="filter-name">待处理</span>
                        <span class="filter-count">{{ statusCounts.pending }}</span>
                    </div>
                    <div class="filter-tab" :class="{ active: filterStatus === 'cooking' }" @click="filterStatus = 'cooking'">
                        <span class="filter-name">制作中</span>
                        <span class="filter-count">{{ statusCounts.cooking }}</span>
                    </div>
                    <div class="filter-tab" :class="{ active: filterStatus === 'ready' }" @click="filterStatus = 'ready'">
                        <span class="filter-name">待取餐</span>
                        <span class="filter-count">{{ statusCounts.ready }}</span>
                    </div>
                    <div class="filter-tab" :class="{ active: filterStatus === 'completed' }" @click="filterStatus = 'completed'">
                        <span class="filter-name">已完成</span>
                        <span class="filter-count">{{ statusCounts.completed }}</span>
                    </div>
                    <div class="filter-tab" :class="{ active: filterStatus === 'cancelled' }" @click="filterStatus = 'cancelled'">
                        <span class="filter-name">已取消</span>
                        <span class="filter-count">{{ statusCounts.cancelled }}</span>
                    </div>
                </div>
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
                        placeholder="搜索订单号或菜品..." 
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
            
            <!-- 加载提示 -->
            <div v-if="loading" class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
            </div>
            
            <!-- 无订单提示 -->
            <div v-else-if="!hasOrders" class="text-center my-5 py-5">
                <i class="bi bi-receipt text-muted" style="font-size: 3.5rem;"></i>
                <p class="mt-3 text-muted">暂无订单记录</p>
                <button class="btn btn-primary mt-3" @click="goToMenu">
                    <i class="bi bi-grid me-1"></i>去点餐
                </button>
            </div>
            
            <!-- 搜索无结果 -->
            <div v-else-if="filteredOrders.length === 0" class="text-center my-5">
                <i class="bi bi-search text-muted" style="font-size: 2rem;"></i>
                <p class="mt-3 text-muted">未找到符合当前条件的订单</p>
                <div class="d-flex justify-content-center gap-2">
                    <button v-if="filterStatus !== 'all'" class="btn btn-outline-primary" @click="filterStatus = 'all'">
                        显示全部订单
                    </button>
                    <button v-if="searchQuery" class="btn btn-outline-primary" @click="searchQuery = ''">
                        清除搜索
                    </button>
                </div>
            </div>
            
            <!-- 订单列表 -->
            <div v-else>
                <div v-for="order in filteredOrders" :key="order.id" class="card order-card mb-3" @click="viewOrder(order.id)">
                    <div class="card-header">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <span class="text-muted me-2">订单号:</span>
                                <span class="order-id fw-bold">{{ formatOrderId(order.id) }}</span>
                                <span class="order-status ms-2" :class="getStatusClass(order.status)">
                                    {{ getStatusText(order.status) }}
                                </span>
                            </div>
                            <span class="order-date text-muted">{{ formatDate(order.timestamp) }}</span>
                        </div>
                    </div>
                    
                    <div class="order-items p-3">
                        <div class="item-summary mb-2">
                            <div class="d-flex flex-wrap">
                                <span v-for="(item, index) in order.items" :key="index" class="item-pill">
                                    {{ item.dish_name }} x{{ item.quantity }}
                                </span>
                            </div>
                        </div>
                        
                        <div v-if="order.note" class="note-section mb-2">
                            <small class="text-muted d-flex align-items-center">
                                <i class="bi bi-chat-left-text me-1"></i>
                                {{ order.note }}
                            </small>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <span class="text-muted">
                                <i class="bi bi-box me-1"></i>
                                {{ getTotalItems(order) }}种商品，共{{ getTotalQuantity(order) }}件
                            </span>
                            <span class="fw-bold">¥{{ order.total_price.toFixed(2) }}</span>
                        </div>
                    </div>
                    
                    <div class="card-footer bg-white d-flex justify-content-between">
                        <button class="btn btn-sm btn-outline-secondary" @click.stop="viewOrderDetail(order.id)">
                            <i class="bi bi-eye me-1"></i>查看详情
                        </button>
                        <button v-if="order.status === 'pending'" class="btn btn-sm btn-outline-primary" @click.stop="updateStatus(order.id, 'cooking')">
                            <i class="bi bi-check-circle me-1"></i>开始制作
                        </button>
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
        viewOrderDetail(orderId) {
            // 明确使用这个方法处理查看详情按钮点击
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
        },
        getTotalItems(order) {
            return order.items.length;
        },
        getTotalQuantity(order) {
            return order.items.reduce((sum, item) => sum + item.quantity, 0);
        },
        refreshOrders() {
            this.$root.fetchOrders();
        },
        updateStatus(orderId, newStatus) {
            axios.put(`/api/orders/${orderId}/status`, { status: newStatus })
                .then(response => {
                    this.$root.showNotification('订单状态已更新', 'success');
                    this.refreshOrders();
                })
                .catch(error => {
                    console.error('更新状态失败:', error);
                    this.$root.showNotification('更新状态失败，请稍后再试', 'error');
                });
        }
    }
});