Vue.component('edit-dish', {
    props: {
        dish: {
            type: Object,
            required: true
        },
        categories: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            form: {
                name: '',
                category: '',
                price: '',
                description: '',
                ingredients: '',
                steps: ''
            },
            image: {
                preview: null,
                data: null
            },
            submitting: false,
            error: ''
        };
    },
    created() {
        // 当组件创建时初始化表单
        this.initForm();
    },
    template: `
        <div class="edit-dish">
            <!-- 返回按钮 -->
            <div class="back-button" @click="goBack">
                <i class="bi bi-arrow-left"></i>
            </div>
            
            <h2 class="mb-3">编辑菜品</h2>
            
            <div class="card mb-4">
                <div class="card-body">
                    <form @submit.prevent="saveDish">
                        <!-- 菜品基本信息 -->
                        <div class="mb-3">
                            <label class="form-label">菜品名称 <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" v-model="form.name" required>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">类别 <span class="text-danger">*</span></label>
                            <select class="form-select" v-model="form.category" required>
                                <option value="">请选择类别</option>
                                <option v-for="category in categories" :key="category.id" :value="category.id">
                                    {{ category.name }}
                                </option>
                            </select>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">价格 (¥) <span class="text-danger">*</span></label>
                            <input type="number" class="form-control" v-model.number="form.price" min="0" step="0.1" required>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">描述</label>
                            <textarea class="form-control" v-model="form.description" rows="2"></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">原料 (多个原料用逗号分隔) <span class="text-danger">*</span></label>
                            <textarea class="form-control" v-model="form.ingredients" rows="2" required></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">做法步骤 (多个步骤用换行分隔) <span class="text-danger">*</span></label>
                            <textarea class="form-control" v-model="form.steps" rows="4" required></textarea>
                        </div>
                        
                        <!-- 菜品图片 -->
                        <div class="mb-3">
                            <label class="form-label">当前菜品图片</label>
                            
                            <!-- 当前图片预览 -->
                            <div class="mb-3">
                                <img :src="dish.image_path" class="current-image img-thumbnail" alt="当前菜品图片" @error="handleImageError">
                            </div>
                            
                            <label class="form-label">更改菜品图片</label>
                            
                            <!-- 图片预览 -->
                            <div v-if="image.preview" class="mb-3">
                                <img :src="image.preview" class="captured-image" alt="菜品图片预览">
                                <button type="button" class="btn btn-sm btn-outline-secondary mt-2" @click="clearImage">
                                    <i class="bi bi-x"></i> 清除图片
                                </button>
                            </div>
                            
                            <!-- 图片上传按钮 -->
                            <div>
                                <label class="btn btn-outline-primary">
                                    <i class="bi bi-image"></i> 从相册选择图片
                                    <input type="file" class="d-none" accept="image/*" @change="onFileSelected">
                                </label>
                            </div>
                        </div>
                        
                        <!-- 错误提示 -->
                        <div v-if="error" class="alert alert-danger" role="alert">
                            {{ error }}
                        </div>
                        
                        <!-- 提交按钮 -->
                        <div class="d-flex gap-2 mt-4">
                            <button type="button" class="btn btn-outline-secondary flex-grow-1" @click="goBack">取消</button>
                            <button type="submit" class="btn btn-primary flex-grow-1" :disabled="submitting">
                                <span v-if="submitting">
                                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    保存中...
                                </span>
                                <span v-else>
                                    <i class="bi bi-check-circle"></i> 保存修改
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `,
    methods: {
        initForm() {
            // 初始化表单数据
            this.form.name = this.dish.name;
            this.form.category = this.dish.category;
            this.form.price = this.dish.price;
            this.form.description = this.dish.description || '';
            
            // 处理原料和步骤数据
            this.form.ingredients = Array.isArray(this.dish.ingredients) 
                ? this.dish.ingredients.join(', ') 
                : this.dish.ingredients;
                
            this.form.steps = Array.isArray(this.dish.steps) 
                ? this.dish.steps.join('\n') 
                : this.dish.steps;
        },
        goBack() {
            this.$emit('back');
        },
        onFileSelected(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // 验证文件类型
            if (!file.type.match('image.*')) {
                this.error = '请选择图片文件';
                return;
            }
            
            // 读取文件为DataURL
            const reader = new FileReader();
            reader.onload = e => {
                this.image.data = e.target.result;
                this.image.preview = e.target.result;
            };
            reader.onerror = () => {
                this.error = '读取图片失败';
            };
            reader.readAsDataURL(file);
        },
        handleImageError(event) {
            // 图片加载失败时使用类别默认图片
            event.target.src = `/static/images/dishes/default-${this.dish.category || 'hot'}.jpg`;
        },
        clearImage() {
            this.image.preview = null;
            this.image.data = null;
        },
        saveDish() {
            console.log("开始保存菜品...");
            // 验证表单
            if (!this.form.name || !this.form.category || !this.form.price || 
                !this.form.ingredients || !this.form.steps) {
                this.error = '请填写所有必填字段';
                return;
            }
            
            this.submitting = true;
            this.error = '';
            
            // 准备菜品数据
            const dishData = {
                name: this.form.name,
                category: this.form.category,
                price: parseFloat(this.form.price),
                description: this.form.description || '',
                ingredients: this.form.ingredients.split(',').map(item => item.trim()),
                steps: this.form.steps.split('\n').filter(step => step.trim() !== '')
            };
            
            // 如果有图片，添加到数据中
            if (this.image.data) {
                dishData.image_data = this.image.data;
                console.log("包含新图片数据，大小约:", Math.round(this.image.data.length / 1024), "KB");
            } else {
                console.log("没有新图片数据，将保持原始图片");
            }
            
            // 发送更新菜品请求
            console.log("发送API请求更新菜品:", dishData.name);
            axios.put(`/api/dishes/${this.dish.id}`, dishData)
                .then(response => {
                    console.log("菜品更新成功:", response.data);
                    // 提示成功
                    this.$root.showNotification('菜品修改成功', 'success');
                    
                    // 返回菜单页面，传递更新后的菜品数据
                    this.$emit('update-dish', response.data);
                })
                .catch(error => {
                    console.error('更新菜品失败:', error);
                    let errorMsg = '更新菜品失败';
                    
                    if (error.response && error.response.data && error.response.data.error) {
                        errorMsg += ': ' + error.response.data.error;
                    } else if (error.message) {
                        errorMsg += ': ' + error.message;
                    }
                    
                    this.error = errorMsg;
                })
                .finally(() => {
                    this.submitting = false;
                });
        }
    }
});