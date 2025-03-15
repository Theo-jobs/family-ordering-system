Vue.component('add-dish', {
    props: {
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
                ingredients: [],
                cookingSteps: []
            },
            newIngredient: '',
            newStep: '',
            editingStep: {
                isEditing: false,
                index: -1,
                content: ''
            },
            image: {
                file: null,
                preview: null
            },
            submitting: false,
            error: null,
            localCategories: []
        };
    },
    created() {
        this.fetchCategories();
    },
    template: `
        <div class="add-dish">
            <!-- 返回按钮 -->
            <div class="back-button" @click="goBack">
                <i class="bi bi-arrow-left"></i>
            </div>
            
            <h2 class="mb-3">添加新菜品</h2>
            
            <div class="card mb-4 home-card">
                <div class="card-body">
                    <!-- 提示说明 -->
                    <div class="alert alert-info mb-4 home-alert">
                        <h5 class="alert-heading"><i class="bi bi-info-circle me-2"></i>添加菜品说明</h5>
                        <p class="mb-0">在此页面添加菜品信息。带有<span class="text-danger">*</span>的字段为必填项。烹饪步骤支持添加、编辑、移动和删除操作。</p>
                    </div>

                    <!-- 错误提示 -->
                    <div class="alert alert-danger mb-3" v-if="error">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ error }}
                    </div>

                    <form @submit.prevent="saveDish">
                        <!-- 菜品基本信息 -->
                        <div class="mb-3">
                            <label class="form-label">菜品名称 <span class="text-danger">*</span></label>
                            <input type="text" class="form-control home-input" v-model="form.name" required>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">类别 <span class="text-danger">*</span></label>
                            <select class="form-select home-select" v-model="form.category" required>
                                <option value="">请选择类别</option>
                                <option v-for="category in localCategories" :key="category.id" :value="category.id">
                                    {{ category.name }}
                                </option>
                            </select>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">成本 (¥) <span class="text-danger">*</span></label>
                            <input type="number" class="form-control home-input" v-model.number="form.price" min="0" step="0.1" required>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">描述</label>
                            <textarea class="form-control home-textarea" v-model="form.description" rows="2" 
                                      placeholder="请输入菜品描述（选填）"></textarea>
                        </div>
                        
                        <!-- 标签式原料输入 -->
                        <div class="mb-4">
                            <label class="form-label">原料 <span class="text-danger">*</span></label>
                            
                            <!-- 已添加的原料标签显示 -->
                            <div class="ingredients-tags mb-2">
                                <span v-for="(ingredient, index) in form.ingredients" 
                                      :key="'ing-'+index" 
                                      class="ingredient-tag">
                                    {{ ingredient }}
                                    <button type="button" class="btn-close btn-close-white ms-1" 
                                            @click="removeIngredient(index)" 
                                            aria-label="删除"></button>
                                </span>
                                <span v-if="form.ingredients.length === 0" class="text-muted fst-italic">
                                    暂无原料，请在下方添加
                                </span>
                            </div>
                            
                            <!-- 原料输入框 -->
                            <div class="input-group">
                                <input type="text" class="form-control home-input" 
                                       placeholder="输入原料名称" 
                                       v-model="newIngredient"
                                       @keyup.enter="addIngredient">
                                <button class="btn btn-primary" type="button" @click="addIngredient">
                                    <i class="bi bi-plus-lg"></i> 添加
                                </button>
                            </div>
                            <small class="form-text text-muted">每个原料添加后会以标签形式显示，点击标签上的 × 可删除</small>
                        </div>
                        
                        <!-- 烹饪步骤 -->
                        <div class="dish-edit-section mb-4">
                            <h5 class="section-title mb-3">
                                <i class="bi bi-list-ol me-2"></i>烹饪步骤
                            </h5>
                            
                            <!-- 烹饪步骤引导 -->
                            <div class="cooking-steps-guide mb-3">
                                <i class="bi bi-info-circle me-2"></i>
                                添加菜品的详细烹饪步骤，帮助家人轻松完成料理。
                            </div>
                            
                            <!-- 步骤列表 -->
                            <div class="steps-list mb-3">
                                <div v-if="form.cookingSteps.length === 0" class="text-muted text-center py-3">
                                    <i class="bi bi-clipboard me-1"></i>暂无步骤，请添加第一个烹饪步骤
                                </div>
                                
                                <div v-else>
                                    <!-- 循环显示步骤列表 -->
                                    <div v-for="(step, index) in form.cookingSteps" :key="index"
                                        :class="['step-item', isEditingStep(index) ? 'step-editing' : '']">
                                        <!-- 步骤编辑模式 -->
                                        <div v-if="isEditingStep(index)" class="step-edit-form">
                                            <div class="input-group">
                                                <span class="input-group-text bg-light">步骤{{ index + 1 }}</span>
                                                <input type="text" class="form-control" 
                                                    v-model="editingStep.content" 
                                                    placeholder="请输入步骤内容"
                                                    @keyup.enter="saveStepEdit">
                                                <button class="btn btn-success" @click="saveStepEdit">
                                                    <i class="bi bi-check-lg"></i>
                                                </button>
                                                <button class="btn btn-secondary" @click="cancelStepEdit">
                                                    <i class="bi bi-x-lg"></i>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <!-- 步骤显示模式 -->
                                        <template v-else>
                                            <div class="step-number">{{ index + 1 }}</div>
                                            <div class="step-content" @click="startEditStep(index)">
                                                {{ step.description }}
                                            </div>
                                            <div class="step-actions">
                                                <button class="step-button" @click="moveStepUp(index, $event)" :disabled="index === 0">
                                                    <i class="bi bi-arrow-up"></i>
                                                </button>
                                                <button class="step-button" @click="moveStepDown(index, $event)" :disabled="index === form.cookingSteps.length - 1">
                                                    <i class="bi bi-arrow-down"></i>
                                                </button>
                                                <button class="step-button delete-btn" @click="deleteStep(index)">
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </template>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 添加新步骤 -->
                            <div class="add-step mb-3">
                                <div class="input-group mb-3">
                                    <input 
                                        type="text" 
                                        class="form-control home-input" 
                                        v-model="newStep" 
                                        placeholder="输入烹饪步骤" 
                                        @keyup.enter="addStep($event)">
                                    <button class="btn btn-primary" @click="addStep($event)">
                                        <i class="bi bi-plus-lg"></i> 添加步骤
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 上传图片 -->
                        <div class="mb-4">
                            <label class="form-label">菜品图片 <span class="text-muted">(选填)</span></label>
                            
                            <div class="image-upload-container" @click="triggerFileInput">
                                <input type="file" ref="imageInput" @change="onFileSelected" accept="image/*" class="d-none">
                                
                                <!-- 图片预览 -->
                                <div v-if="image.preview" class="image-preview-container">
                                    <img :src="image.preview" class="image-preview" alt="预览图">
                                    <button type="button" class="clear-preview-btn" @click.stop="clearImagePreview">
                                        <i class="bi bi-x"></i>
                                    </button>
                                </div>
                                
                                <!-- 上传提示 -->
                                <div v-else class="upload-placeholder">
                                    <i class="bi bi-image fs-2"></i>
                                    <p>点击上传菜品图片</p>
                                    <small class="text-muted">支持JPG、PNG格式，最大2MB</small>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 提交按钮 -->
                        <div class="text-center">
                            <button type="submit" class="btn btn-primary btn-lg px-5" :disabled="submitting">
                                <span v-if="submitting">
                                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    保存中...
                                </span>
                                <span v-else>
                                    <i class="bi bi-check-circle me-1"></i> 保存菜品
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `,
    methods: {
        fetchCategories() {
            // 获取所有菜品类别
            axios.get('/api/categories')
                .then(response => {
                    console.log('获取类别成功:', response);
                    this.localCategories = response.data;
                })
                .catch(error => {
                    console.error('获取类别失败:', error);
                    this.error = '无法加载菜品类别，请刷新重试';
                });
        },
        
        // 生成唯一ID
        generateUniqueId() {
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000);
            return `step_${timestamp}_${random}`;
        },
        
        // 原料相关方法
        addIngredient() {
            const ingredient = this.newIngredient.trim();
            if (!ingredient) return;
            
            // 检查是否重复
            if (!this.form.ingredients.includes(ingredient)) {
                this.form.ingredients.push(ingredient);
                console.log('原料添加成功:', ingredient);
                
                // 添加动画效果
                this.$nextTick(() => {
                    const tags = document.querySelectorAll('.ingredient-tag');
                    if (tags.length > 0) {
                        const newTag = tags[tags.length - 1];
                        newTag.classList.add('step-added');
                        setTimeout(() => {
                            newTag.classList.remove('step-added');
                        }, 1000);
                    }
                });
            } else {
                console.log('原料已存在:', ingredient);
                this.error = '该原料已添加';
                setTimeout(() => {
                    this.error = null;
                }, 2000);
            }
            
            // 清空输入框
            this.newIngredient = '';
        },
        
        removeIngredient(index) {
            if (index >= 0 && index < this.form.ingredients.length) {
                const removed = this.form.ingredients.splice(index, 1);
                console.log('原料删除成功:', removed);
            }
        },
        
        // 烹饪步骤相关方法
        addStep(event) {
            if (!this.newStep.trim()) {
                // 步骤内容为空，不添加
                return;
            }
            
            // 创建新步骤对象
            const newStepObj = {
                id: this.generateUniqueId(), // 添加唯一ID
                description: this.newStep.trim(),
                order: this.form.cookingSteps.length + 1
            };
            
            // 添加到步骤数组，不立即更新顺序
            this.form.cookingSteps.push(newStepObj);
            // 不调用updateStepOrders，保存时才统一更新
            
            // 清空输入框
            this.newStep = '';
            
            // 添加高亮效果
            this.$nextTick(() => {
                const lastStep = document.querySelector('.step-item:last-child');
                if (lastStep) {
                    lastStep.classList.add('step-highlight');
                    setTimeout(() => {
                        lastStep.classList.remove('step-highlight');
                    }, 1000);
                }
            });
            
            // 防止事件冒泡和默认行为
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
        },
        
        deleteStep(index) {
            if (confirm('确定要删除这个步骤吗？')) {
                // 直接删除步骤，不更新顺序
                this.form.cookingSteps.splice(index, 1);
                // 不调用updateStepOrders，保存时才统一更新
            }
        },
        
        // 上移步骤
        moveStepUp(index, event) {
            if (index > 0) {
                // 阻止事件冒泡，防止触发返回等其他按钮
                event.stopPropagation();
                event.preventDefault();
                
                // 交换两个步骤的位置，同时也交换order属性
                const temp = this.form.cookingSteps[index];
                const prevStep = this.form.cookingSteps[index - 1];
                
                // 交换order属性
                if (temp.order !== undefined && prevStep.order !== undefined) {
                    const tempOrder = temp.order;
                    temp.order = prevStep.order;
                    prevStep.order = tempOrder;
                }
                
                // 交换数组位置
                this.$set(this.form.cookingSteps, index, prevStep);
                this.$set(this.form.cookingSteps, index - 1, temp);
                
                console.log('步骤上移成功，当前步骤顺序:', 
                    this.form.cookingSteps.map(s => `${s.order}:${s.description.substring(0, 10)}...`));
            }
        },
        
        // 下移步骤
        moveStepDown(index, event) {
            if (index < this.form.cookingSteps.length - 1) {
                // 阻止事件冒泡，防止触发返回等其他按钮
                event.stopPropagation();
                event.preventDefault();
                
                // 交换两个步骤的位置，同时也交换order属性
                const temp = this.form.cookingSteps[index];
                const nextStep = this.form.cookingSteps[index + 1];
                
                // 交换order属性
                if (temp.order !== undefined && nextStep.order !== undefined) {
                    const tempOrder = temp.order;
                    temp.order = nextStep.order;
                    nextStep.order = tempOrder;
                }
                
                // 交换数组位置
                this.$set(this.form.cookingSteps, index, nextStep);
                this.$set(this.form.cookingSteps, index + 1, temp);
                
                console.log('步骤下移成功，当前步骤顺序:', 
                    this.form.cookingSteps.map(s => `${s.order}:${s.description.substring(0, 10)}...`));
            }
        },
        
        // 更新所有步骤的顺序属性
        updateStepOrders() {
            try {
                console.log('开始更新步骤顺序，当前步骤数据:', JSON.stringify(this.form.cookingSteps));
                
                // 检查数组是否有效
                if (!Array.isArray(this.form.cookingSteps)) {
                    console.error('步骤数据不是数组，重置为空数组');
                    this.form.cookingSteps = [];
                    return;
                }
                
                if (this.form.cookingSteps.length === 0) {
                    console.log('步骤数组为空，无需更新顺序');
                    return;
                }
                
                // 确保每个步骤都有order属性
                this.form.cookingSteps.forEach((step, i) => {
                    if (typeof step !== 'object') {
                        console.error(`第${i+1}个步骤不是对象:`, step);
                        // 修复步骤格式
                        this.$set(this.form.cookingSteps, i, {
                            id: this.generateUniqueId(),
                            description: String(step),
                            order: i + 1
                        });
                    } else if (typeof step.order === 'undefined') {
                        console.log(`第${i+1}个步骤缺少order属性，添加order=${i+1}`);
                        this.$set(step, 'order', i + 1);
                    }
                });
                
                // 首先确保数组按照order排序
                this.form.cookingSteps.sort((a, b) => {
                    const orderA = typeof a.order === 'number' ? a.order : parseInt(a.order) || 0;
                    const orderB = typeof b.order === 'number' ? b.order : parseInt(b.order) || 0;
                    return orderA - orderB;
                });
                
                // 然后重新分配连续的order值
                this.form.cookingSteps.forEach((step, i) => {
                    const newOrder = i + 1;
                    if (step.order !== newOrder) {
                        console.log(`更新步骤 "${step.description}" 的顺序: ${step.order} -> ${newOrder}`);
                        this.$set(step, 'order', newOrder);
                    }
                });
                
                console.log('步骤顺序更新完成:', JSON.stringify(this.form.cookingSteps));
            } catch (error) {
                console.error('更新步骤顺序时出错:', error);
            }
        },
        
        // 步骤编辑相关方法
        isEditingStep(index) {
            return this.editingStep.isEditing && this.editingStep.index === index;
        },
        
        startEditStep(index) {
            // 如果已经在编辑其他步骤，先保存那个步骤
            if (this.editingStep.isEditing && this.editingStep.index !== index) {
                this.saveStepEdit();
            }
            
            if (index >= 0 && index < this.form.cookingSteps.length) {
                // 保存当前编辑状态
                this.editingStep = {
                    isEditing: true,
                    index: index,
                    content: this.form.cookingSteps[index].description
                };
                
                // 焦点到输入框
                this.$nextTick(() => {
                    const inputElement = document.querySelector('.step-edit-form input');
                    if (inputElement) {
                        inputElement.focus();
                        inputElement.select();
                    }
                });
            }
        },
        
        saveStepEdit() {
            if (this.editingStep.isEditing) {
                const index = this.editingStep.index;
                
                // 只有当内容有效时才保存
                if (this.editingStep.content.trim()) {
                    this.$set(this.form.cookingSteps[index], 'description', this.editingStep.content.trim());
                }
                
                // 重置编辑状态
                this.editingStep = {
                    isEditing: false,
                    index: -1,
                    content: ''
                };
            }
        },
        
        cancelStepEdit() {
            // 取消编辑，恢复原始状态
            this.editingStep = {
                isEditing: false,
                index: -1,
                content: ''
            };
        },
        
        // 表单提交相关方法
        saveDish() {
            // 如果正在编辑，先保存编辑内容
            if (this.editingStep.isEditing) {
                this.saveStepEdit();
            }
            
            // 重置错误
            this.error = null;
            
            // 验证表单
            if (!this.form.name) {
                this.error = "请填写菜品名称";
                this.focusField('.form-control[v-model="form.name"]');
                return;
            }
            
            if (!this.form.category) {
                this.error = "请选择菜品类别";
                this.focusField('.form-select[v-model="form.category"]');
                return;
            }
            
            if (this.form.ingredients.length === 0) {
                this.error = "请至少添加一种原料";
                this.focusField('input[v-model="newIngredient"]');
                return;
            }
            
            if (this.form.cookingSteps.length === 0) {
                this.error = "请至少添加一个烹饪步骤";
                this.focusField('input[v-model="newStep"]');
                return;
            }
            
            // 确保步骤顺序正确
            this.updateStepOrders();
            
            this.submitting = true;
            
            // 准备提交的数据
            const dishData = {
                name: this.form.name,
                category_id: this.form.category,
                category: this.form.category, // 添加category字段，兼容后端API
                price: this.form.price,
                description: this.form.description,
                ingredients: this.form.ingredients.join(','), // 数组转为逗号分隔字符串
                steps: this.form.cookingSteps.map(step => step.description).join('\n'), // 兼容旧数据结构
                cooking_steps: JSON.stringify(this.form.cookingSteps)
            };
            
            console.log('准备提交菜品数据:', {
                name: dishData.name,
                category: dishData.category_id,
                ingredients_count: this.form.ingredients.length,
                steps_count: this.form.cookingSteps.length
            });
            
            // 根据服务器期望的格式处理请求
            // 如果有图片，则先创建菜品，然后上传图片
            // 如果没有图片，则直接提交JSON数据
            if (this.image.file) {
                // 先以JSON格式创建菜品
                axios.post('/api/dishes', dishData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    const dishId = response.data.id;
                    console.log('菜品创建成功，ID:', dishId);
                    
                    // 如果有图片，再上传图片
                    if (this.image.file) {
                        const formData = new FormData();
                        formData.append('image', this.image.file);
                        
                        return axios.post(`/api/dishes/${dishId}/image`, formData, {
                            headers: {
                                'Content-Type': 'multipart/form-data'
                            }
                        });
                    }
                    
                    // 显示成功提示
                    this.$root.showNotification('菜品添加成功', 'success');
                    
                    // 通知父组件菜品添加成功，传递菜品数据
                    const newDishData = {
                        ...dishData,
                        id: response.data?.id || Date.now() // 如果没有id，使用时间戳作为临时id
                    };
                    console.log('添加菜品成功，发送数据到父组件:', newDishData);
                    this.$emit('save-dish', newDishData);
                    
                    // 等待一点时间再返回，以便用户看到成功通知
                    setTimeout(() => {
                        this.goBack();
                    }, 1000);
                })
                .catch(error => {
                    console.error('添加菜品失败:', error);
                    this.error = error.response?.data?.message || 
                                 error.response?.data?.error || 
                                 '保存失败，请检查表单数据格式并重试';
                    
                    // 滚动到错误提示
                    this.$nextTick(() => {
                        const errorElement = document.querySelector('.alert-danger');
                        if (errorElement) {
                            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    });
                })
                .finally(() => {
                    this.submitting = false;
                });
            } else {
                // 无图片，直接以JSON格式提交
                axios.post('/api/dishes', dishData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    // 显示成功提示
                    this.$root.showNotification('菜品添加成功', 'success');
                    
                    // 通知父组件菜品添加成功，传递菜品数据
                    const newDishData = {
                        ...dishData,
                        id: response.data?.id || Date.now() // 如果没有id，使用时间戳作为临时id
                    };
                    console.log('添加菜品成功，发送数据到父组件:', newDishData);
                    this.$emit('save-dish', newDishData);
                    
                    // 等待一点时间再返回，以便用户看到成功通知
                    setTimeout(() => {
                        this.goBack();
                    }, 1000);
                })
                .catch(error => {
                    console.error('添加菜品失败:', error);
                    this.error = error.response?.data?.message || 
                                 error.response?.data?.error || 
                                 '保存失败，请检查表单数据格式并重试';
                    
                    // 滚动到错误提示
                    this.$nextTick(() => {
                        const errorElement = document.querySelector('.alert-danger');
                        if (errorElement) {
                            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    });
                })
                .finally(() => {
                    this.submitting = false;
                });
            }
        },
        
        // 辅助方法：聚焦指定元素
        focusField(selector) {
            this.$nextTick(() => {
                const element = document.querySelector(selector);
                if (element) {
                    element.focus();
                    if (element.select) {
                        element.select();
                    }
                }
            });
        },
        
        // 图片相关方法
        onFileSelected(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // 验证文件类型
            if (!file.type.match('image.*')) {
                this.error = '请选择图片文件';
                this.$refs.imageInput.value = '';
                return;
            }
            
            // 验证文件大小（最大2MB）
            if (file.size > 2 * 1024 * 1024) {
                this.error = '图片大小不能超过2MB';
                this.$refs.imageInput.value = '';
                return;
            }
            
            // 保存文件引用
            this.image.file = file;
            
            // 创建预览
            const reader = new FileReader();
            reader.onload = (e) => {
                this.image.preview = e.target.result;
            };
            reader.readAsDataURL(file);
            
            // 清空file input
            this.$refs.imageInput.value = '';
        },
        
        clearImagePreview() {
            this.image.file = null;
            this.image.preview = null;
        },
        
        triggerFileInput() {
            this.$refs.imageInput.click();
        },
        
        goBack() {
            this.$emit('back');
        }
    }
});