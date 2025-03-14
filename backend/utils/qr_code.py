# 这个文件保留原来的函数接口，但不再动态生成二维码
# 前端会直接使用静态的微信收款码.jpg

def generate_qr_code(data, box_size=10, border=4):
    """
    不再动态生成二维码，保留函数接口以兼容现有代码
    """
    # 返回一个占位符URL，实际上前端会使用静态图片
    return "占位符，前端将使用静态图片"

def generate_dish_qr_code(dish_data):
    """为菜品生成二维码（仅保留接口）"""
    return generate_qr_code(dish_data)

def generate_order_qr_code(order_data):
    """为订单生成二维码（仅保留接口）"""
    return generate_qr_code(order_data)