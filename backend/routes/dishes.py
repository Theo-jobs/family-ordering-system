from flask import Blueprint, jsonify, request
import json
import os
import uuid
import base64
from datetime import datetime

dishes_bp = Blueprint('dishes', __name__)

# 读取JSON文件辅助函数
def read_json_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print(f"警告: {file_path} 无法读取或为空，返回空列表")
        return []

# 写入JSON文件辅助函数
def write_json_file(file_path, data):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

# 获取所有菜品
@dishes_bp.route('/', methods=['GET'])
def get_all_dishes():
    try:
        # 使用绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        dishes_path = os.path.join(root_dir, 'static', 'data', 'dishes.json')
        reviews_path = os.path.join(root_dir, 'static', 'data', 'reviews.json')
        
        dishes = read_json_file(dishes_path)
        reviews = read_json_file(reviews_path)
        
        # 检查是否有菜品数据
        if not dishes:
            # 如果没有数据，添加示例数据
            dishes = create_sample_dishes()
            write_json_file(dishes_path, dishes)
        
        # 为每个菜品计算平均评分
        for dish in dishes:
            dish_reviews = [review for review in reviews if review.get('dish_id') == dish.get('id')]
            if dish_reviews:
                ratings = [review.get('rating', 0) for review in dish_reviews]
                dish['avg_rating'] = sum(ratings) / len(ratings)
                # 获取最新评价
                latest_review = max(dish_reviews, key=lambda x: x.get('timestamp', ''))
                dish['latest_review'] = latest_review.get('comment', '')[:50] + '...' if len(latest_review.get('comment', '')) > 50 else latest_review.get('comment', '')
            else:
                dish['avg_rating'] = None
                dish['latest_review'] = None
        
        print(f"返回菜品数据: {len(dishes)} 个菜品")
        return jsonify(dishes)
    except Exception as e:
        print(f"获取菜品数据错误: {str(e)}")
        return jsonify({"error": f"获取菜品数据错误: {str(e)}"}), 500

# 按ID获取菜品
@dishes_bp.route('/<dish_id>', methods=['GET'])
def get_dish_by_id(dish_id):
    try:
        # 使用绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        dishes_path = os.path.join(root_dir, 'static', 'data', 'dishes.json')
        reviews_path = os.path.join(root_dir, 'static', 'data', 'reviews.json')
        
        dishes = read_json_file(dishes_path)
        reviews = read_json_file(reviews_path)
        
        dish = next((d for d in dishes if d.get('id') == dish_id), None)
        if not dish:
            return jsonify({"error": "菜品未找到"}), 404
        
        # 获取该菜品的所有评价
        dish_reviews = [review for review in reviews if review.get('dish_id') == dish_id]
        dish['reviews'] = dish_reviews
        
        # 计算平均评分
        if dish_reviews:
            ratings = [review.get('rating', 0) for review in dish_reviews]
            dish['avg_rating'] = sum(ratings) / len(ratings)
        else:
            dish['avg_rating'] = None
        
        return jsonify(dish)
    except Exception as e:
        print(f"获取菜品详情错误: {str(e)}")
        return jsonify({"error": f"获取菜品详情错误: {str(e)}"}), 500

# 按类别获取菜品
@dishes_bp.route('/category/<category>', methods=['GET'])
def get_dishes_by_category(category):
    try:
        # 使用绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        dishes_path = os.path.join(root_dir, 'static', 'data', 'dishes.json')
        reviews_path = os.path.join(root_dir, 'static', 'data', 'reviews.json')
        
        dishes = read_json_file(dishes_path)
        reviews = read_json_file(reviews_path)
        
        # 检查是否有菜品数据
        if not dishes:
            # 如果没有数据，添加示例数据
            dishes = create_sample_dishes()
            write_json_file(dishes_path, dishes)
        
        # 按类别过滤菜品
        category_dishes = [d for d in dishes if d.get('category', '').lower() == category.lower()]
        
        # 打印调试信息
        print(f"类别 '{category}' 的菜品数量: {len(category_dishes)}")
        if not category_dishes:
            print(f"所有可用类别: {set(d.get('category', '') for d in dishes)}")
        
        # 为每个菜品计算平均评分
        for dish in category_dishes:
            dish_reviews = [review for review in reviews if review.get('dish_id') == dish.get('id')]
            if dish_reviews:
                ratings = [review.get('rating', 0) for review in dish_reviews]
                dish['avg_rating'] = sum(ratings) / len(ratings)
                # 获取最新评价
                latest_review = max(dish_reviews, key=lambda x: x.get('timestamp', ''))
                dish['latest_review'] = latest_review.get('comment', '')[:50] + '...' if len(latest_review.get('comment', '')) > 50 else latest_review.get('comment', '')
            else:
                dish['avg_rating'] = None
                dish['latest_review'] = None
        
        return jsonify(category_dishes)
    except Exception as e:
        print(f"按类别获取菜品错误: {str(e)}")
        return jsonify({"error": f"按类别获取菜品错误: {str(e)}"}), 500

# 添加新菜品
@dishes_bp.route('/', methods=['POST'])
def add_dish():
    try:
        data = request.json
        
        # 验证必填字段
        required_fields = ['name', 'category', 'price', 'description', 'ingredients', 'steps']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"缺少必填字段: {field}"}), 400
        
        # 获取当前目录的绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        
        # 确保图片目录存在
        images_dir = os.path.join(root_dir, 'static', 'images', 'dishes')
        os.makedirs(images_dir, exist_ok=True)
        
        # 处理图片
        if 'image_data' in data and data['image_data']:
            # 解码base64图片
            try:
                # 确保我们有一个base64编码的字符串
                if ',' in data['image_data']:
                    image_data = data['image_data'].split(',')[1]
                else:
                    image_data = data['image_data']
                
                image_binary = base64.b64decode(image_data)
                
                # 生成唯一文件名
                filename = f"{uuid.uuid4()}.jpg"
                file_path = os.path.join(images_dir, filename)
                
                # 打印调试信息
                print(f"保存图片到: {file_path}")
                
                # 保存图片
                with open(file_path, 'wb') as f:
                    f.write(image_binary)
                
                image_path = f"/static/images/dishes/{filename}"
            except Exception as e:
                print(f"图片处理错误: {str(e)}")
                return jsonify({"error": f"图片处理错误: {str(e)}"}), 400
        else:
            # 使用随机图片
            image_path = f"/static/images/dishes/default-{data['category']}.jpg"
        
        # 创建新菜品对象
        new_dish = {
            "id": str(uuid.uuid4()),
            "name": data['name'],
            "category": data['category'],
            "price": float(data['price']),
            "description": data['description'],
            "ingredients": data['ingredients'],
            "steps": data['steps'],
            "image_path": image_path,
            "timestamp": datetime.now().isoformat()
        }
        
        # 读取现有菜品
        dishes_path = os.path.join(root_dir, 'static', 'data', 'dishes.json')
        dishes = read_json_file(dishes_path)
        
        # 添加新菜品
        dishes.append(new_dish)
        
        # 写入更新的菜品列表
        write_json_file(dishes_path, dishes)
        
        return jsonify(new_dish), 201
    except Exception as e:
        print(f"添加菜品错误: {str(e)}")
        return jsonify({"error": f"添加菜品错误: {str(e)}"}), 500

# 创建示例菜品数据
def create_sample_dishes():
    categories = {
        'hot': '热菜',
        'cold': '凉菜',
        'staple': '主食',
        'drink': '饮料',
        'coffee': '咖啡',
        'dessert': '甜点'
    }
    
    sample_dishes = [
        {
            "id": str(uuid.uuid4()),
            "name": "红烧肉",
            "category": "hot",
            "price": 48.0,
            "description": "传统经典菜肴，肥而不腻，口感醇厚",
            "ingredients": ["五花肉", "葱", "姜", "蒜", "冰糖", "酱油", "料酒"],
            "steps": [
                "将五花肉切成大小适中的方块，焯水去除血水",
                "锅中放入少量油，加入冰糖小火炒至融化呈棕褐色",
                "加入肉块翻炒至表面上色",
                "加入葱姜蒜、酱油、料酒和适量清水",
                "大火烧开后转小火慢炖1小时至肉烂",
                "大火收汁即可出锅"
            ],
            "image_path": "/static/images/dishes/default-hot.jpg",
            "timestamp": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "凉拌黄瓜",
            "category": "cold",
            "price": 18.0,
            "description": "清爽开胃，夏日必备凉菜",
            "ingredients": ["黄瓜", "蒜", "香醋", "生抽", "香油", "盐", "白糖", "辣椒油"],
            "steps": [
                "黄瓜洗净，拍碎后切成段",
                "蒜切末",
                "将黄瓜放入碗中，加入蒜末",
                "加入香醋、生抽、香油、盐、白糖和辣椒油",
                "充分拌匀即可"
            ],
            "image_path": "/static/images/dishes/default-cold.jpg",
            "timestamp": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "蛋炒饭",
            "category": "staple",
            "price": 22.0,
            "description": "家常美味，简单易做",
            "ingredients": ["米饭", "鸡蛋", "葱", "盐", "酱油", "食用油"],
            "steps": [
                "提前准备好隔夜米饭",
                "鸡蛋打散",
                "热锅冷油，倒入鸡蛋炒散",
                "加入米饭，用铲子将米饭打散",
                "加入适量盐和酱油调味",
                "最后加入葱花翻炒均匀即可"
            ],
            "image_path": "/static/images/dishes/default-staple.jpg",
            "timestamp": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "柠檬水",
            "category": "drink",
            "price": 12.0,
            "description": "清新酸爽，消暑解渴",
            "ingredients": ["柠檬", "蜂蜜", "温水"],
            "steps": [
                "柠檬洗净，切片",
                "将柠檬片放入杯中",
                "加入适量蜂蜜",
                "倒入温水搅拌均匀",
                "可根据个人口味调整蜂蜜用量"
            ],
            "image_path": "/static/images/dishes/default-drink.jpg",
            "timestamp": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "拿铁咖啡",
            "category": "coffee",
            "price": 22.0,
            "description": "丝滑顺口，奶香浓郁",
            "ingredients": ["浓缩咖啡", "牛奶", "奶泡"],
            "steps": [
                "制作浓缩咖啡",
                "将牛奶加热至60-70℃",
                "打发牛奶制作奶泡",
                "将浓缩咖啡倒入杯中",
                "慢慢倒入热牛奶",
                "最后加入奶泡即可"
            ],
            "image_path": "/static/images/dishes/default-coffee.jpg",
            "timestamp": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "提拉米苏",
            "category": "dessert",
            "price": 28.0,
            "description": "意式经典甜点，口感松软",
            "ingredients": ["马斯卡彭奶酪", "手指饼干", "咖啡", "蛋黄", "白糖", "可可粉"],
            "steps": [
                "咖啡煮好冷却备用",
                "蛋黄加白糖打发至颜色变浅发白",
                "加入马斯卡彭奶酪搅拌均匀",
                "手指饼干浸入咖啡中两秒钟",
                "将沾有咖啡的手指饼干排列在容器底部",
                "铺上一层奶酪混合物",
                "重复上述步骤直至容器填满",
                "最顶层撒上可可粉",
                "冷藏4小时以上即可食用"
            ],
            "image_path": "/static/images/dishes/default-dessert.jpg",
            "timestamp": datetime.now().isoformat()
        }
    ]
    
    return sample_dishes

# 更新菜品
@dishes_bp.route('/<dish_id>', methods=['PUT'])
def update_dish(dish_id):
    try:
        data = request.json
        
        # 获取当前目录的绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        dishes_path = os.path.join(root_dir, 'static', 'data', 'dishes.json')
        
        # 读取现有菜品
        dishes = read_json_file(dishes_path)
        
        # 查找要更新的菜品
        dish_index = next((i for i, d in enumerate(dishes) if d.get('id') == dish_id), None)
        if dish_index is None:
            return jsonify({"error": "菜品未找到"}), 404
        
        # 更新字段
        for key in data:
            if key != 'id' and key != 'image_data':  # 不允许更改ID
                dishes[dish_index][key] = data[key]
        
        # 处理图片（如果提供）
        if 'image_data' in data and data['image_data']:
            try:
                # 确保我们有一个base64编码的字符串
                if ',' in data['image_data']:
                    image_data = data['image_data'].split(',')[1]
                else:
                    image_data = data['image_data']
                
                image_binary = base64.b64decode(image_data)
                
                # 生成唯一文件名
                filename = f"{uuid.uuid4()}.jpg"
                file_path = os.path.join(root_dir, 'static', 'images', 'dishes', filename)
                
                # 确保目录存在
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                
                # 保存图片
                with open(file_path, 'wb') as f:
                    f.write(image_binary)
                
                dishes[dish_index]['image_path'] = f"/static/images/dishes/{filename}"
            except Exception as e:
                print(f"图片处理错误: {str(e)}")
                return jsonify({"error": f"图片处理错误: {str(e)}"}), 400
        
        # 更新时间戳
        dishes[dish_index]['timestamp'] = datetime.now().isoformat()
        
        # 写入更新的菜品列表
        write_json_file(dishes_path, dishes)
        
        return jsonify(dishes[dish_index])
    except Exception as e:
        print(f"更新菜品错误: {str(e)}")
        return jsonify({"error": f"更新菜品错误: {str(e)}"}), 500

# 删除菜品
@dishes_bp.route('/<dish_id>', methods=['DELETE'])
def delete_dish(dish_id):
    try:
        # 获取当前目录的绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        dishes_path = os.path.join(root_dir, 'static', 'data', 'dishes.json')
        
        # 读取现有菜品
        dishes = read_json_file(dishes_path)
        
        # 查找要删除的菜品
        dish = next((d for d in dishes if d.get('id') == dish_id), None)
        if not dish:
            return jsonify({"error": "菜品未找到"}), 404
        
        # 移除菜品
        dishes = [d for d in dishes if d.get('id') != dish_id]
        
        # 写入更新的菜品列表
        write_json_file(dishes_path, dishes)
        
        return jsonify({"message": "菜品删除成功"})
    except Exception as e:
        print(f"删除菜品错误: {str(e)}")
        return jsonify({"error": f"删除菜品错误: {str(e)}"}), 500