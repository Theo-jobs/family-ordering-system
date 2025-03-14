from flask import Blueprint, jsonify, request
import json
import os
import uuid
from datetime import datetime

orders_bp = Blueprint('orders', __name__)

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
    # 确保目录存在
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

# 获取所有订单
@orders_bp.route('/', methods=['GET'])
def get_all_orders():
    try:
        # 使用绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        orders_path = os.path.join(root_dir, 'static', 'data', 'orders.json')
        
        # 确保文件存在
        if not os.path.exists(orders_path):
            os.makedirs(os.path.dirname(orders_path), exist_ok=True)
            with open(orders_path, 'w', encoding='utf-8') as f:
                json.dump([], f)
            print(f"创建新的订单文件: {orders_path}")
            return jsonify([])
            
        orders = read_json_file(orders_path)
        
        # 按时间倒序排列
        orders.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return jsonify(orders)
    except Exception as e:
        print(f"获取订单错误: {str(e)}")
        return jsonify({"error": f"获取订单错误: {str(e)}"}), 500

# 按ID获取订单
@orders_bp.route('/<order_id>', methods=['GET'])
def get_order_by_id(order_id):
    try:
        # 使用绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        orders_path = os.path.join(root_dir, 'static', 'data', 'orders.json')
        
        orders = read_json_file(orders_path)
        order = next((o for o in orders if o.get('id') == order_id), None)
        
        if not order:
            return jsonify({"error": "订单未找到"}), 404
        
        # 不需要生成二维码，前端会使用静态图片
        return jsonify(order)
    except Exception as e:
        print(f"获取订单详情错误: {str(e)}")
        return jsonify({"error": f"获取订单详情错误: {str(e)}"}), 500

# 创建新订单
@orders_bp.route('/', methods=['POST'])
def create_order():
    try:
        data = request.json
        
        # 验证必填字段
        if 'items' not in data or not data['items']:
            return jsonify({"error": "订单必须包含菜品"}), 400
        
        # 获取绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        dishes_path = os.path.join(root_dir, 'static', 'data', 'dishes.json')
        orders_path = os.path.join(root_dir, 'static', 'data', 'orders.json')
        
        # 读取菜品信息来计算总价
        dishes = read_json_file(dishes_path)
        
        # 创建订单项并计算总价
        order_items = []
        total_price = 0
        
        for item in data['items']:
            dish_id = item['dish_id']
            quantity = item['quantity']
            
            # 查找菜品
            dish = next((d for d in dishes if d.get('id') == dish_id), None)
            if not dish:
                return jsonify({"error": f"菜品ID {dish_id} 未找到"}), 400
            
            # 计算项目价格
            item_price = dish.get('price', 0) * quantity
            total_price += item_price
            
            # 添加订单项
            order_items.append({
                "dish_id": dish_id,
                "dish_name": dish.get('name', '未知菜品'),
                "quantity": quantity,
                "price": dish.get('price', 0),
                "total": item_price,
                "image_path": dish.get('image_path', '')
            })
        
        # 创建新订单
        new_order = {
            "id": str(uuid.uuid4()),
            "items": order_items,
            "total_price": total_price,
            "status": "pending",  # 初始状态为待处理
            "timestamp": datetime.now().isoformat(),
            "note": data.get('note', '')
        }
        
        # 读取现有订单
        orders = read_json_file(orders_path)
        
        # 添加新订单
        orders.append(new_order)
        
        # 写入更新的订单列表
        write_json_file(orders_path, orders)
        
        return jsonify(new_order), 201
    except Exception as e:
        print(f"创建订单错误: {str(e)}")
        return jsonify({"error": f"创建订单错误: {str(e)}"}), 500

# 更新订单状态
@orders_bp.route('/<order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    try:
        data = request.json
        
        if 'status' not in data:
            return jsonify({"error": "缺少状态字段"}), 400
        
        new_status = data['status']
        valid_statuses = ['pending', 'cooking', 'ready', 'completed', 'cancelled']
        
        if new_status not in valid_statuses:
            return jsonify({"error": f"无效的状态. 有效状态: {', '.join(valid_statuses)}"}), 400
        
        # 获取绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        orders_path = os.path.join(root_dir, 'static', 'data', 'orders.json')
        
        # 读取现有订单
        orders = read_json_file(orders_path)
        
        # 查找要更新的订单
        order_index = next((i for i, o in enumerate(orders) if o.get('id') == order_id), None)
        if order_index is None:
            return jsonify({"error": "订单未找到"}), 404
        
        # 更新订单状态
        orders[order_index]['status'] = new_status
        orders[order_index]['updated_at'] = datetime.now().isoformat()
        
        # 写入更新的订单列表
        write_json_file(orders_path, orders)
        
        return jsonify(orders[order_index])
    except Exception as e:
        print(f"更新订单状态错误: {str(e)}")
        return jsonify({"error": f"更新订单状态错误: {str(e)}"}), 500

# 删除订单
@orders_bp.route('/<order_id>', methods=['DELETE'])
def delete_order(order_id):
    try:
        # 获取绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        orders_path = os.path.join(root_dir, 'static', 'data', 'orders.json')
        
        # 读取现有订单
        orders = read_json_file(orders_path)
        
        # 查找要删除的订单
        order = next((o for o in orders if o.get('id') == order_id), None)
        if not order:
            return jsonify({"error": "订单未找到"}), 404
        
        # 移除订单
        orders = [o for o in orders if o.get('id') != order_id]
        
        # 写入更新的订单列表
        write_json_file(orders_path, orders)
        
        return jsonify({"message": "订单删除成功"})
    except Exception as e:
        print(f"删除订单错误: {str(e)}")
        return jsonify({"error": f"删除订单错误: {str(e)}"}), 500