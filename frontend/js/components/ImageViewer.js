/**
 * 图片查看器组件
 * 用于在模态框中预览图片，支持标准图片、二维码和评价图片
 */
Vue.component('image-viewer', {
    props: {
        // 图片路径
        imagePath: {
            type: String,
            required: true
        },
        // 查看器类型: 'standard', 'qrcode', 'review'
        viewerType: {
            type: String,
            default: 'standard',
            validator: function(value) {
                return ['standard', 'qrcode', 'review'].indexOf(value) !== -1
            }
        },
        // 标题，主要用于二维码查看器
        title: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            imageLoaded: false
        };
    },
    computed: {
        // 确定是否显示标题
        showTitle() {
            return this.title && this.viewerType === 'qrcode';
        }
    },
    watch: {
        // 当图片路径改变时重置加载状态
        imagePath() {
            this.imageLoaded = false;
        }
    },
    methods: {
        // 处理图片加载事件
        handleImageLoad() {
            this.imageLoaded = true;
        },
        
        // 处理图片加载错误
        handleImageError(event) {
            console.log("图片加载失败");
            event.target.onerror = null; // 防止无限循环
            event.target.src = "/static/images/reviews/default-review.jpg";
            
            // 如果默认图片也加载失败，使用内联base64小图标
            event.target.onerror = function() {
                event.target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNjY2NjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ij48L2NpcmNsZT48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIj48L3BvbHlsaW5lPjwvc3ZnPg==";
            };
        },
        
        // 关闭查看器
        close(event) {
            if (event) {
                event.stopPropagation(); // 阻止事件冒泡
            }
            this.$emit('close');
        },
        
        // 处理背景点击关闭
        handleBackgroundClick(event) {
            // 只有当点击的是背景元素时才关闭
            if (event.target === event.currentTarget) {
                this.close(event);
            }
        }
    },
    template: `
        <div class="image-viewer" @click="handleBackgroundClick">
            <div class="image-viewer-content" :class="{'text-center': viewerType !== 'standard'}">
                <img 
                    :src="imagePath" 
                    :class="viewerType === 'standard' ? 'full-image' : 'preview-image'"
                    :alt="viewerType === 'qrcode' ? '二维码' : '图片'"
                    @load="handleImageLoad"
                    @error="viewerType === 'review' ? handleImageError($event) : null"
                    v-show="imageLoaded"
                >
                
                <!-- 加载指示器 -->
                <div v-if="!imageLoaded" class="preview-loading"></div>
                
                <!-- 二维码标题 -->
                <div v-if="showTitle" class="mt-3 text-white">
                    <h4>{{ title }}</h4>
                    <p>点击任意位置关闭</p>
                </div>
                
                <!-- 关闭按钮 -->
                <button class="close-preview" data-action="close-viewer" @click.stop="close">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        </div>
    `
}); 