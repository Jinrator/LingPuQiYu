# Authing 登录集成完整指南

> 一站式微信、QQ、手机号登录解决方案

## 📋 目录

- [快速开始](#快速开始)
- [功能特性](#功能特性)
- [详细配置](#详细配置)
- [代码使用](#代码使用)
- [后端对接](#后端对接)
- [常见问题](#常见问题)

---

## 🎉 集成状态

✅ **已完成集成**，当前使用 Mock 模式（模拟登录）

### 已集成的文件

```
src/
├── components/layout/
│   └── AuthPage.tsx              # 登录页面（已集成 Authing）
├── hooks/
│   └── useAuthing.ts             # Authing React Hook（支持 Mock 模式）
├── services/
│   ├── authingService.ts         # Authing 服务层
│   └── api.ts                    # API 配置
├── types/
│   └── auth.ts                   # 类型定义
└── utils/
    └── storage.ts                # 本地存储工具
```

### 当前模式

- 🔧 **Mock 模式**：未配置 Authing 时自动使用模拟登录
- ✅ **生产模式**：配置 Authing 后自动切换到真实登录

---

## 🚀 快速开始

### 第1步：注册 Authing 账号（5分钟）

1. 访问 [https://www.authing.cn/](https://www.authing.cn/)
2. 点击「免费注册」
3. 创建应用，选择「单页 Web 应用」
4. 记录你的 `App ID` 和 `App Host`

### 第2步：配置环境变量（1分钟）

创建 `.env.local` 文件：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，填入你的配置：

```env
# Authing 配置
VITE_AUTHING_APP_ID=你的_APP_ID
VITE_AUTHING_APP_HOST=https://你的应用域名.authing.cn

# API 配置（可选）
VITE_API_BASE_URL=https://api.example.com
```

### 第3步：配置回调地址（1分钟）

在 Authing 控制台 → 应用配置 → 认证配置：

- **登录回调 URL**：`http://localhost:5173`（开发环境）
- **登出回调 URL**：`http://localhost:5173`
- 生产环境改为你的实际域名

### 第4步：配置登录方式（10分钟）

#### 方式1：手机号验证码登录（推荐，最简单）

1. 进入控制台 → 设置 → 短信服务
2. 选择「使用 Authing 测试短信服务」（免费）
3. 或配置自己的短信服务商（阿里云、腾讯云等）

#### 方式2：微信登录

1. 前往 [微信开放平台](https://open.weixin.qq.com/) 创建网站应用
2. 获取 `AppID` 和 `AppSecret`
3. 在 Authing 控制台 → 身份源 → 社会化登录 → 微信PC扫码
4. 填入以下信息：
   - AppID
   - AppSecret
   - 回调地址：`https://你的应用域名.authing.cn/api/v2/connection/social/wechat:pc/callback`
5. 保存配置

#### 方式3：QQ登录

1. 前往 [QQ互联](https://connect.qq.com/) 创建应用
2. 获取 `App ID` 和 `App Key`
3. 在 Authing 控制台 → 身份源 → 社会化登录 → QQ
4. 填入配置：
   - App ID
   - App Key
   - 回调地址：`https://你的应用域名.authing.cn/api/v2/connection/social/qq/callback`
5. 保存配置

#### 方式4：支付宝登录

1. 前往 [支付宝开放平台](https://open.alipay.com/) 创建应用
2. 获取 `App ID` 和密钥
3. 在 Authing 控制台 → 身份源 → 社会化登录 → 支付宝
4. 填入配置并保存

### 第5步：测试登录

```bash
npm run dev
```

访问 http://localhost:5173

- **Mock 模式**：未配置 Authing 时，输入任意手机号和验证码即可登录（验证码在控制台显示）
- **生产模式**：配置 Authing 后，使用真实的微信/QQ/手机号登录

---

## 🎯 功能特性

### 支持的登录方式

#### 已集成到代码
- ✅ 手机号验证码登录
- ✅ 微信扫码登录
- ✅ QQ登录

#### 可快速添加（只需在控制台配置）
- 支付宝登录
- 微博登录
- 钉钉登录
- 企业微信登录
- GitHub登录
- Google登录
- 邮箱密码登录
- 用户名密码登录

### 核心功能

- ✅ 自动 Token 管理
- ✅ 自动刷新 Token
- ✅ 多端同步登录状态
- ✅ 安全的本地存储
- ✅ HTTPS 加密传输
- ✅ 企业级安全防护
- ✅ Mock 模式（开发阶段）
- ✅ 用户信息管理
- ✅ 自定义用户字段

---

## 📱 代码使用

### useAuthing Hook

```tsx
import { useAuthing } from '../hooks/useAuthing';

function MyComponent() {
  const { 
    user,                    // 当前用户信息
    isAuthenticated,         // 是否已登录
    isLoading,              // 加载状态
    loginWithPhone,         // 手机号登录
    loginWithWechat,        // 微信登录
    loginWithQQ,            // QQ登录
    sendSmsCode,            // 发送验证码
    register,               // 注册
    logout                  // 登出
  } = useAuthing();

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>欢迎，{user.username}</p>
          <button onClick={logout}>退出</button>
        </div>
      ) : (
        <button onClick={() => loginWithWechat()}>微信登录</button>
      )}
    </div>
  );
}
```

### 手机号登录示例

```tsx
const handlePhoneLogin = async () => {
  // 1. 发送验证码
  const result = await sendSmsCode('13800138000');
  if (result.success) {
    console.log('验证码已发送');
  }

  // 2. 登录
  const loginResult = await loginWithPhone('13800138000', '123456');
  if (loginResult.success) {
    console.log('登录成功');
  } else {
    console.error(loginResult.message);
  }
};
```

### 微信登录示例

```tsx
const handleWechatLogin = async () => {
  // 会自动跳转到微信登录页面
  await loginWithWechat();
};
```

### 注册示例

```tsx
const handleRegister = async () => {
  const result = await register({
    phone: '13800138000',
    code: '123456',
    username: '张三',
    profile: {
      courseType: 'PRODUCER',  // 自定义字段
      age: 18
    }
  });

  if (result.success) {
    console.log('注册成功');
  }
};
```

### 获取用户信息

```tsx
const { user, isAuthenticated } = useAuthing();

if (isAuthenticated) {
  console.log('用户ID:', user.id);
  console.log('用户名:', user.username);
  console.log('手机号:', user.phone);
  console.log('头像:', user.avatar);
  console.log('自定义字段:', user.profile);
}
```

### 登出

```tsx
const handleLogout = async () => {
  await logout();
  console.log('已退出登录');
};
```

---

## 🔧 详细配置

### 环境变量说明

```env
# Authing App ID（必填）
VITE_AUTHING_APP_ID=你的_APP_ID

# Authing App Host（必填）
VITE_AUTHING_APP_HOST=https://你的应用域名.authing.cn

# API 基础地址（可选，用于后端对接）
VITE_API_BASE_URL=https://api.example.com
```

### Mock 模式说明

当未配置 `VITE_AUTHING_APP_ID` 或值为 `你的_AUTHING_APP_ID` 时，自动启用 Mock 模式：

- ✅ 手机号登录：输入任意11位手机号和4位以上验证码即可登录
- ✅ 验证码：在浏览器控制台显示
- ✅ 用户信息：自动生成模拟数据
- ⚠️ 微信/QQ登录：仅显示提示，不会真实跳转

### 生产模式

配置正确的 `VITE_AUTHING_APP_ID` 后，自动切换到生产模式：

- ✅ 真实的微信/QQ登录
- ✅ 真实的短信验证码
- ✅ 用户数据保存到 Authing 云端
- ✅ 支持多端同步

---

## 🔄 后端对接

### 前端传递 Token

前端登录成功后，Token 会自动保存在 localStorage 中。

在调用后端 API 时，会自动在请求头中添加：

```
Authorization: Bearer <token>
```

### 后端验证 Token

#### Node.js 示例

```javascript
const { ManagementClient } = require('authing-js-sdk');

const client = new ManagementClient({
  userPoolId: 'YOUR_USERPOOL_ID',
  secret: 'YOUR_SECRET',
});

// 中间件：验证 Token
app.use(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: '未提供 Token' });
  }
  
  try {
    const user = await client.checkLoginStatus(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token 无效或已过期' });
  }
});

// 受保护的路由
app.get('/api/user/profile', (req, res) => {
  res.json({
    user: req.user
  });
});
```

#### Python (Flask) 示例

```python
from flask import Flask, request, jsonify
from authing import AuthenticationClient

app = Flask(__name__)

client = AuthenticationClient(
    app_id='YOUR_APP_ID',
    app_host='https://your-app.authing.cn'
)

# 装饰器：验证 Token
def require_auth(f):
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'message': '未提供 Token'}), 401
        
        try:
            user = client.check_login_status(token)
            request.user = user
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'message': 'Token 无效或已过期'}), 401
    
    return decorated_function

# 受保护的路由
@app.route('/api/user/profile')
@require_auth
def get_profile():
    return jsonify({
        'user': request.user
    })
```

#### Java (Spring Boot) 示例

```java
import cn.authing.sdk.java.client.ManagementClient;
import cn.authing.sdk.java.dto.CheckLoginStatusDto;

@RestController
public class UserController {
    
    private ManagementClient client = new ManagementClient(
        "YOUR_USERPOOL_ID",
        "YOUR_SECRET"
    );
    
    @GetMapping("/api/user/profile")
    public ResponseEntity<?> getProfile(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        
        try {
            CheckLoginStatusDto dto = new CheckLoginStatusDto();
            dto.setToken(token);
            
            User user = client.checkLoginStatus(dto);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Token 无效或已过期");
        }
    }
}
```

### 获取用户信息

```javascript
// Node.js
const user = await client.users.detail(userId);

// Python
user = client.get_user(user_id)

// Java
User user = client.users().get(userId);
```

### 更新用户信息

```javascript
// Node.js
await client.users.update(userId, {
  nickname: '新昵称',
  photo: 'https://example.com/avatar.jpg'
});

// Python
client.update_user(user_id, {
    'nickname': '新昵称',
    'photo': 'https://example.com/avatar.jpg'
})
```

---

## 💰 费用说明

### 免费版（推荐）

- **8,000 MAU**（月活跃用户）
- 所有登录方式
- 基础用户管理
- 社区支持
- **适合**：个人项目、小型应用、MVP

### 付费版

| 版本 | 价格 | MAU | 特性 |
|------|------|-----|------|
| 基础版 | ¥199/月 | 20,000 | 基础功能 + 邮件支持 |
| 专业版 | ¥999/月 | 100,000 | 高级功能 + SSO + MFA |
| 企业版 | 定制 | 无限制 | 全部功能 + 专属支持 |

---

## 🆚 方案对比

### vs 自建方案

| 对比项 | Authing | 自建方案 |
|--------|---------|----------|
| 开发时间 | **1小时** | 1-2周 |
| 微信/QQ登录 | **开箱即用** | 需对接多个平台 |
| 用户管理 | **自动管理** | 需自建数据库 |
| Token管理 | **自动处理** | 需自己实现 |
| 安全性 | **企业级** | 需自己保障 |
| 维护成本 | **零维护** | 持续维护 |
| 后端对接 | **提供API** | 需自己开发 |

### vs Firebase

| 对比项 | Authing | Firebase |
|--------|---------|----------|
| 国内访问 | ✅ 稳定 | ❌ 不稳定 |
| 微信/QQ | ✅ 支持 | ❌ 不支持 |
| 中文文档 | ✅ 完善 | ⚠️ 较少 |
| 价格 | ✅ 便宜 | ⚠️ 较贵 |
| 国内法规 | ✅ 符合 | ⚠️ 需注意 |

### vs Auth0

| 对比项 | Authing | Auth0 |
|--------|---------|-------|
| 价格 | ✅ 更便宜 | ⚠️ 较贵 |
| 微信/QQ | ✅ 支持 | ❌ 不支持 |
| 国内访问 | ✅ 快 | ⚠️ 较慢 |
| 中文支持 | ✅ 完善 | ⚠️ 较少 |

---

## ❓ 常见问题

### Q1: 需要备案域名吗？

**A:** 
- 开发环境：不需要
- 生产环境（手机号登录）：不需要
- 生产环境（微信登录）：需要备案域名

### Q2: 免费版够用吗？

**A:** 8000 MAU 对于大多数项目足够了。MAU 是指月活跃用户，不是总用户数。

### Q3: 如何切换到生产环境？

**A:** 只需更新 `.env.local` 中的回调地址和 Authing 控制台的配置即可。

### Q4: 支持小程序吗？

**A:** 支持！Authing 有专门的小程序 SDK。

### Q5: 如何自定义登录页面？

**A:** 当前已经是自定义页面。你也可以使用 Authing 提供的托管登录页。

### Q6: Token 过期怎么办？

**A:** Authing 会自动刷新 Token，无需手动处理。

### Q7: 如何获取用户手机号？

**A:** 登录成功后，`user.phone` 即为用户手机号。

### Q8: 可以自定义用户字段吗？

**A:** 可以！在注册时传入 `profile` 对象即可。

### Q9: 如何实现单点登录（SSO）？

**A:** 升级到专业版，在控制台配置 SSO 即可。

### Q10: 数据安全吗？

**A:** Authing 通过了 ISO 27001、SOC 2 等多项安全认证，数据存储在国内云服务器。

---

## 🔗 相关链接

- [Authing 官网](https://www.authing.cn/)
- [Authing 文档](https://docs.authing.cn/)
- [React SDK 文档](https://docs.authing.cn/v3/reference/sdk/web/)
- [控制台](https://console.authing.cn/)
- [微信开放平台](https://open.weixin.qq.com/)
- [QQ互联](https://connect.qq.com/)
- [支付宝开放平台](https://open.alipay.com/)

---

## 📞 技术支持

### 社区支持
- [Authing 论坛](https://forum.authing.cn/)
- [GitHub Issues](https://github.com/Authing/authing-js-sdk/issues)

### 付费支持
- 邮件：support@authing.cn
- 工单系统（控制台）
- 专属技术顾问（企业版）
