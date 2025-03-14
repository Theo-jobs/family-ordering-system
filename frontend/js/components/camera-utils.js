// 简化后的图片选择组件
Vue.component('ios-camera', {
    props: {
        value: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            photoTaken: false,
            photoData: '',
            error: ''
        };
    },
    template: `
    <div class="ios-camera">
        <div v-if="error" class="alert alert-warning">
            {{ error }}
        </div>
        
        <!-- 从相册选择按钮 -->
        <div v-if="!photoTaken" class="camera-buttons mb-3">
            <label class="btn btn-primary">
                <i class="bi bi-image"></i> 从相册选择图片
                <input type="file" accept="image/*" @change="onFileSelected" hidden>
            </label>
        </div>
        
        <!-- 已选择图片预览 -->
        <div v-if="photoTaken" class="photo-container">
            <img :src="photoData" class="photo-preview img-fluid rounded" style="max-height: 300px;">
            
            <div class="photo-controls mt-3">
                <button class="btn btn-success" @click="acceptPhoto">
                    <i class="bi bi-check"></i> 使用此图片
                </button>
                <button class="btn btn-outline-secondary ml-2" @click="clearPhoto">
                    <i class="bi bi-x"></i> 清除图片
                </button>
            </div>
        </div>
    </div>
    `,
    methods: {
        onFileSelected(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (!file.type.match('image.*')) {
                this.error = '请选择图片文件';
                return;
            }
            
            // 读取文件为DataURL
            const reader = new FileReader();
            reader.onload = (e) => {
                this.photoData = e.target.result;
                this.photoTaken = true;
            };
            reader.onerror = () => {
                this.error = '读取图片失败';
            };
            reader.readAsDataURL(file);
        },
        acceptPhoto() {
            // 将图片数据传递给父组件
            this.$emit('input', this.photoData);
            this.$emit('photo-taken', this.photoData);
        },
        clearPhoto() {
            // 清除已选图片
            this.photoTaken = false;
            this.photoData = '';
        }
    }
});