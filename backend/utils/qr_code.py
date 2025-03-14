import qrcode
from io import BytesIO
import base64
import json

def generate_qr_code(data, box_size=10, border=4):
    """
    生成数据的二维码
    
    Parameters:
        data: 要编码的数据（字符串或JSON对象）
        box_size: 二维码中每个格子的像素大小
        border: 二维码的边界宽度（格子数）
    
    Returns:
        返回Base64编码的二维码图像数据URI
    """
    # 如果传入的是JSON对象，则将其转换为字符串
    if isinstance(data, (dict, list)):
        data = json.dumps(data, ensure_ascii=False)
    
    # 创建QR码对象
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=box_size,
        border=border,
    )
    
    # 添加数据并制作二维码
    qr.add_data(data)
    qr.make(fit=True)
    
    # 创建图像
    img = qr.make_image(fill_color="black", back_color="white")
    
    # 将图像转换为Base64字符串
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    # 返回数据URI
    return f"data:image/png;base64,{img_str}"

def generate_dish_qr_code(dish_data):
    """为菜品生成二维码"""
    return generate_qr_code(dish_data)

def generate_order_qr_code(order_data):
    """为订单生成二维码"""
    return generate_qr_code(order_data)