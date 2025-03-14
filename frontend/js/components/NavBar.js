Vue.component('nav-bar', {
    props: {
        activeTab: {
            type: String,
            required: true
        },
        cartCount: {
            type: Number,
            default: 0
        }
    },
    template: `
        <div class="bottom-nav">
            <div class="nav-item" :class="{ active: activeTab === 'menu' }" @click="changeTab('menu')">
                <i class="bi bi-grid nav-icon"></i>
                <span class="nav-text">菜单</span>
            </div>
            <div class="nav-item" :class="{ active: activeTab === 'cart' }" @click="changeTab('cart')" style="position: relative;">
                <i class="bi bi-cart nav-icon"></i>
                <span class="nav-text">购物车</span>
                <span v-if="cartCount > 0" class="cart-badge">{{ cartCount > 99 ? '99+' : cartCount }}</span>
            </div>
            <div class="nav-item" :class="{ active: activeTab === 'orders' || activeTab === 'order-detail' }" @click="changeTab('orders')">
                <i class="bi bi-receipt nav-icon"></i>
                <span class="nav-text">订单</span>
            </div>
            <div class="nav-item" :class="{ active: activeTab === 'add-dish' }" @click="changeTab('add-dish')">
                <i class="bi bi-plus-circle nav-icon"></i>
                <span class="nav-text">添加</span>
            </div>
        </div>
    `,
    methods: {
        changeTab(tab) {
            // 只允许切换到这些主要标签页
            const mainTabs = ['menu', 'cart', 'orders', 'add-dish'];
            if (mainTabs.includes(tab)) {
                this.$emit('change-tab', tab);
            }
        }
    }
});