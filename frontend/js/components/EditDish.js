Vue.component('edit-dish', {
    props: {
        dish_id: {
            type: [Number, String],
            required: true
        }
    },
    data() {
        return {
            dish: {},
            categories: [],
            form: {
                name: "",
                category: "",
                price: 0,
                description: "",
                ingredients: [],
                cookingSteps: [],
            },
            newStep: "",
            editingStep: {
                isEditing: false,
                index: -1,
                content: ""
            },
            newIngredient: "",
            submitting: false,
            error: null,
            successMessage: null,
            image: {
                file: null,
                preview: null,
                url: null,
                loaded: false
            },
            loading: true
        }
    },
    created() {
        console.log('EditDish组件创建，菜品ID:', this.dish_id);
        this.fetchDish();
        this.fetchCategories();
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
                    <!-- 提示说明 -->
                    <div class="alert alert-info mb-4">
                        <h5 class="alert-heading"><i class="bi bi-info-circle me-2"></i>编辑菜品说明</h5>
                        <p class="mb-0">您可以在此页面编辑菜品信息。带有<span class="text-danger">*</span>的字段为必填项。烹饪步骤支持上下移动调整顺序。</p>
                    </div>

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
                            <label class="form-label">成本 (¥) <span class="text-danger">*</span></label>
                            <input type="number" class="form-control" v-model.number="form.price" min="0" step="0.1" required>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">描述</label>
                            <textarea class="form-control" v-model="form.description" rows="2" 
                                      placeholder="请输入菜品描述（选填）"></textarea>
                        </div>
                        
                        <!-- 标签式原料输入 -->
                        <div class="mb-3">
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
                            
                            <!-- 原料添加输入框 -->
                            <div class="input-group">
                                <input type="text" class="form-control" 
                                       placeholder="输入原料名称" 
                                       v-model="newIngredient"
                                       @keyup.enter="addIngredient">
                                <button type="button" class="btn btn-outline-primary" 
                                        @click="addIngredient"
                                        :disabled="!newIngredient.trim()">
                                    <i class="bi bi-plus-lg"></i>
                                </button>
                            </div>
                            <div class="form-text">每次添加一种原料，点击添加按钮或按回车键确认</div>
                        </div>
                        
                        <!-- 烹饪步骤部分 -->
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
                                <div class="input-group">
                                    <input type="text" class="form-control" 
                                        v-model="newStep" 
                                        placeholder="输入新步骤"
                                        @keyup.enter="addStep">
                                    <button class="btn btn-primary" @click="addStep">
                                        <i class="bi bi-plus"></i> 添加步骤
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 菜品图片 -->
                        <div class="mb-4">
                            <label class="form-label">菜品图片</label>
                            <div class="mb-3">
                                <div class="custom-file-upload">
                                    <button type="button" class="btn btn-outline-primary" @click="triggerFileInput">
                                        <i class="bi bi-cloud-upload me-2"></i>选择图片
                                    </button>
                                <input 
                                    type="file" 
                                        class="d-none" 
                                    accept="image/*" 
                                    @change="onFileSelected" 
                                    ref="imageInput"
                                >
                                </div>
                            </div>
                            
                            <!-- 图片预览 -->
                            <div v-if="image.preview" class="image-preview-container">
                                <img :src="image.preview" alt="图片预览" class="image-preview">
                                <button type="button" class="clear-preview-btn" @click="clearImagePreview">
                                    <i class="bi bi-x"></i>
                                </button>
                            </div>
                            
                            <!-- 原图片显示 -->
                            <div v-else-if="dish.image_path" class="image-preview-container">
                                <img :src="dish.image_path" alt="当前图片" class="image-preview">
                                <p class="mt-2 text-muted small">当前图片 (上传新图片将替换)</p>
                            </div>
                        </div>
                        
                        <!-- 错误提示 -->
                        <div v-if="error" class="alert alert-danger" role="alert">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>
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
        fetchDish() {
            this.loading = true;
            
            // 获取菜品详情
            axios.get(`/api/dishes/${this.dish_id}`)
                .then(response => {
                    // 存储原始菜品数据
                    this.dish = response.data;
                    
                    // 初始化表单数据
                    this.initForm(response.data);
                    
                    // 加载图片预览
                    if (response.data.image_path) {
                        this.loadImagePreview(response.data.image_path);
                    }
                    
                    this.loading = false;
                })
                .catch(error => {
                    console.error('获取菜品详情失败:', error);
                    this.error = '无法加载菜品信息，请刷新页面重试';
                    this.loading = false;
                });
        },
        
        fetchCategories() {
            // 获取所有菜品类别
            axios.get('/api/categories')
                .then(response => {
                    this.categories = response.data;
                })
                .catch(error => {
                    console.error('获取类别失败:', error);
                    this.error = '无法加载菜品类别，请刷新重试';
                });
        },
        
        initForm(dish) {
            if (!dish) {
                console.error('初始化表单时菜品数据为空');
                this.error = '菜品数据加载失败，请返回重试';
                return;
            }
            
            // 基本信息
            this.form.name = dish.name || '';
            // 优先使用category_id，如果没有再尝试使用category，确保类别正确设置
            this.form.category = dish.category_id || dish.category || '';
            this.form.price = parseFloat(dish.price) || 0;
            this.form.description = dish.description || '';
            
            // 处理原料列表 - 转换为数组
            try {
                if (dish.ingredients) {
                    if (typeof dish.ingredients === 'string') {
                        // 逗号分隔的字符串转为数组
                        this.form.ingredients = dish.ingredients
                            .split(',')
                            .map(item => item.trim())
                            .filter(item => item);
                    } else if (Array.isArray(dish.ingredients)) {
                        this.form.ingredients = [...dish.ingredients];
                    }
                } else {
                    this.form.ingredients = [];
                }
            } catch (e) {
                console.error('处理原料数据时出错:', e);
                this.form.ingredients = [];
            }
            
            // 处理烹饪步骤
            try {
                // 初始化为空数组
                this.form.cookingSteps = [];
                
                // 检查是否有结构化的cooking_steps数据
                if (dish.cooking_steps) {
                    let parsedSteps = [];
                    
                    // 尝试解析JSON字符串
                    if (typeof dish.cooking_steps === 'string') {
                        try {
                            parsedSteps = JSON.parse(dish.cooking_steps);
                        } catch (e) {
                            console.warn('解析cooking_steps JSON失败', e);
                            // 按行拆分成步骤
                            parsedSteps = dish.cooking_steps.split('\n')
                                .filter(step => step.trim())
                                .map((step, index) => ({
                                    id: this.generateUniqueId(),
                                    description: step.trim(),
                                    order: index + 1
                                }));
                        }
                    } else if (Array.isArray(dish.cooking_steps)) {
                        // 已经是数组直接使用
                        parsedSteps = dish.cooking_steps;
                    }
                    
                    // 确保每个步骤有必要的属性
                    this.form.cookingSteps = parsedSteps.map((step, index) => {
                        if (typeof step === 'string') {
                            return {
                                id: this.generateUniqueId(),
                                description: step,
                                order: index + 1
                            };
                        }
                        return {
                            id: step.id || this.generateUniqueId(),
                            description: step.description || (typeof step === 'string' ? step : ''),
                            order: step.order || index + 1
                        };
                    });
                }
                
                // 如果cookingSteps为空但有steps，则从steps中导入
                if (this.form.cookingSteps.length === 0 && dish.steps) {
                    // 将steps按行分割
                    const stepsArr = typeof dish.steps === 'string' 
                        ? dish.steps.split('\n').filter(step => step.trim())
                        : Array.isArray(dish.steps) ? dish.steps : [];
                    
                    // 转换为结构化步骤
                    this.form.cookingSteps = stepsArr.map((step, index) => ({
                        id: this.generateUniqueId(),
                        description: typeof step === 'string' ? step.trim() : String(step),
                        order: index + 1
                    }));
                }
                
                // 确保步骤顺序正确
                this.form.cookingSteps.sort((a, b) => a.order - b.order);
                
                // 确保步骤显示正确
                this.$nextTick(() => {
                    this.updateStepOrders();
                });
            } catch (error) {
                console.error('处理步骤数据时发生错误:', error);
                this.form.cookingSteps = [];
            }
            
            // 初始化dish对象
            this.dish = {...dish};
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
            } else {
                console.log('原料已存在:', ingredient);
                // 可以添加一个提示
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
        
        // 步骤相关方法
        addStep() {
            if (!this.newStep.trim()) {
                // 步骤内容为空，不添加
                return;
            }
            
            // 创建新步骤对象
            const newStepObj = {
                id: this.generateUniqueId(), // 添加ID以确保唯一性
                description: this.newStep.trim(),
                order: this.form.cookingSteps.length + 1
            };
            
            // 添加到步骤数组，不再立即更新顺序
            this.form.cookingSteps.push(newStepObj);
            
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
        },
        
        deleteStep(index) {
            if (confirm('确定要删除这个步骤吗？')) {
                // 直接删除步骤，不更新顺序
                this.form.cookingSteps.splice(index, 1);
                // 不调用updateStepOrders，保存时统一更新
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
            
            console.log('提交前步骤顺序:', JSON.stringify(this.form.cookingSteps));
            
            this.submitting = true;
            
            // 准备提交的数据
            const dishData = {
                name: this.form.name,
                category_id: this.form.category,
                price: this.form.price,
                description: this.form.description,
                ingredients: this.form.ingredients.join(','), // 数组转为逗号分隔字符串
                steps: this.form.cookingSteps.map(step => step.description).join('\n'), // 兼容旧数据结构
                cooking_steps: JSON.stringify(this.form.cookingSteps)
            };
            
            // 输出要保存的数据
            console.log('准备提交菜品数据:', {
                dish_id: this.dish_id,
                name: dishData.name,
                category: dishData.category_id,
                ingredients_count: this.form.ingredients.length,
                steps_count: this.form.cookingSteps.length
            });
            
            // 根据有无图片分别处理请求
            if (this.image.file) {
                // 先以JSON格式更新菜品基本信息
                axios.put(`/api/dishes/${this.dish_id}`, dishData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    console.log('菜品基本信息更新成功');
                    
                    // 上传图片
                    const formData = new FormData();
                    formData.append('image', this.image.file);
                    
                    return axios.post(`/api/dishes/${this.dish_id}/image`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                })
                .then(this.handleSaveSuccess)
                .catch(this.handleSaveError)
                .finally(() => {
                    this.submitting = false;
                });
            } else {
                // 无图片，直接以JSON格式提交
                axios.put(`/api/dishes/${this.dish_id}`, dishData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(this.handleSaveSuccess)
                .catch(this.handleSaveError)
                .finally(() => {
                    this.submitting = false;
                });
            }
        },
        
        // 处理保存成功
        handleSaveSuccess(response) {
            console.log('菜品更新成功，准备返回菜单页面');
            
            // 显示成功提示
            this.$root.showNotification('菜品更新成功', 'success');
            
            // 获取最新的数据（优先使用响应数据，否则使用本地表单数据）
            const updatedDish = response.data || {
                id: this.dish_id,
                name: this.form.name,
                category_id: this.form.category,
                category: this.form.category, // 同时包含category和category_id
                price: this.form.price,
                description: this.form.description,
                ingredients: this.form.ingredients.join(','),
                steps: this.form.cookingSteps.map(step => step.description).join('\n'),
                cooking_steps: JSON.stringify(this.form.cookingSteps),
                image_path: this.image.preview || this.dish.image_path // 确保有图片路径
            };
            
            console.log('发送更新后的菜品数据:', updatedDish);
            
            // 通知父组件菜品已更新，需要刷新数据
            this.$emit('dish-updated', updatedDish);
            
            // 返回到菜品管理页面
            this.goBack();
        },
        
        // 处理保存错误
        handleSaveError(error) {
            console.error('更新菜品失败:', error);
            this.error = error.response?.data?.message || error.response?.data?.error || '保存失败，请重试';
            
            // 滚动到错误提示
            this.$nextTick(() => {
                const errorElement = document.querySelector('.alert-danger');
                if (errorElement) {
                    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
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
        handleImageError(event) {
            console.warn('图片加载失败，使用默认图片');
            // 使用类别默认图片
            const categoryId = this.form.category || 'default';
            event.target.src = `/static/images/dishes/default-${categoryId}.jpg`;
            
            // 如果多次失败，尝试最通用的默认图片
            event.onerror = () => {
                event.target.src = '/static/images/dishes/default-dish.jpg';
                // 防止无限循环
                event.onerror = null;
            };
        },
        clearImagePreview() {
            this.image.file = null;
            this.image.preview = null;
        },
        goBack() {
            this.$emit('back');
        },
        triggerFileInput() {
            this.$refs.imageInput.click();
        },
        // 加载图片预览
        loadImagePreview(imageUrl) {
            if (!imageUrl) return;
            
            console.log('加载图片预览:', imageUrl);
            
            // 设置预览URL
            this.image.url = imageUrl;
            this.image.preview = imageUrl;
            this.image.loaded = true;
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
    }
});