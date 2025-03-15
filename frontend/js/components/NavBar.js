Vue.component('nav-bar', {
    props: {
        activeTab: {
            type: String,
            required: true
        },
        cartItemsCount: {
            type: Number,
            default: 0
        }
    },
    template: `
        <div class="bottom-nav fixed-bottom">
            <div class="nav-item" :class="{ active: activeTab === 'menu' }" @click="$emit('tab-change', 'menu')">
                <i class="nav-icon bi bi-house-door"></i>
                <span class="nav-text">菜单</span>
            </div>
            <div class="nav-item" :class="{ active: activeTab === 'cart' }" @click="$emit('tab-change', 'cart')">
                <i class="nav-icon bi bi-cart"></i>
                <span class="nav-text">购物车</span>
                <span class="cart-badge" v-if="cartItemsCount > 0">{{ cartItemsCount }}</span>
            </div>
            <div class="nav-item" :class="{ active: activeTab === 'orders' }" @click="$emit('tab-change', 'orders')">
                <i class="nav-icon bi bi-receipt"></i>
                <span class="nav-text">订单</span>
            </div>
        </div>
    `
});