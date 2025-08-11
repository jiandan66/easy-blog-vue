<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>欢迎登录</h1>
        <p>请选择登录方式</p>
      </div>

      <!-- 登录方式切换 -->
      <div class="login-tabs">
        <button
            :class="['tab-btn', { active: loginType === 'password' }]"
            @click="loginType = 'password'"
        >
          账号密码登录
        </button>
        <button
            :class="['tab-btn', { active: loginType === 'email' }]"
            @click="loginType = 'email'"
        >
          邮箱验证码登录
        </button>
      </div>

      <!-- 账号密码登录表单 -->
      <form v-if="loginType === 'password'" @submit.prevent="handlePasswordLogin" class="login-form">
        <div class="form-group">
          <label for="username">用户名/邮箱</label>
          <input
              id="username"
              v-model="passwordForm.account"
              type="text"
              placeholder="请输入用户名或邮箱"
              required
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <div class="password-input">
            <input
                id="password"
                v-model="passwordForm.pwd"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                required
            />
            <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </div>

        <!-- 图像验证码 -->
        <div class="form-group">
          <label for="captcha">图像验证码</label>
          <div class="captcha-input">
                         <input
                 id="captcha"
                 v-model="passwordForm.kaptChaCode"
                 type="text"
                 placeholder="请输入验证码"
                 maxlength="6"
                 required
             />
            <div class="captcha-image" @click="refreshCaptcha">
              <img v-if="captchaUrl" :src="captchaUrl" alt="验证码" />
              <div v-else class="captcha-loading">加载中...</div>
            </div>
          </div>
        </div>

        <div class="form-options">
          <a href="#" class="forgot-link">忘记密码？</a>
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <!-- 邮箱验证码登录表单 -->
      <form v-if="loginType === 'email'" @submit.prevent="handleEmailLogin" class="login-form">
        <div class="form-group">
          <label for="email">邮箱地址</label>
          <input
              id="email"
              v-model="emailForm.account"
              type="email"
              placeholder="请输入邮箱地址"
              @blur="() => {}"
              required
          />
          <small class="help-text" v-if="emailForm.account && !isValidEmail(emailForm.account)">
            请输入有效的邮箱地址
          </small>
        </div>

        <!-- 图像验证码 -->
        <div class="form-group">
          <label for="email-captcha">图像验证码</label>
          <div class="captcha-input">
                         <input
                 id="email-captcha"
                 v-model="emailForm.kaptChaCode"
                 type="text"
                 placeholder="请输入验证码"
                 maxlength="6"
                 required
             />
            <div class="captcha-image" @click="refreshEmailCaptcha">
              <img v-if="emailCaptchaUrl" :src="emailCaptchaUrl" alt="验证码" />
              <div v-else class="captcha-loading">加载中...</div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="code">邮箱验证码</label>
          <div class="code-input">
            <input
                id="code"
                v-model="emailForm.emailCode"
                type="text"
                placeholder="请输入验证码"
                maxlength="6"
                required
            />
            <button
                type="button"
                class="send-code-btn"
                @click="sendCode"
                :disabled="countdown > 0"
            >
              {{ countdown > 0 ? `${countdown}s后重发` : '发送验证码' }}
            </button>
          </div>
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {ref, reactive, onMounted} from 'vue'
import {api_email_login, api_login, api_send_email, api_getImg_code, api_check_code} from "@/api/api.ts";
import {ElMessage} from "element-plus";
import {useRouter} from "vue-router";

const $router = useRouter();

// 登录方式
const loginType = ref<'password' | 'email'>('password')

// 加载状态
const loading = ref(false)

// 密码显示状态
const showPassword = ref(false)

// 倒计时
const countdown = ref(0)

// 图像验证码相关
const captchaUrl = ref('')
const captchaUuid = ref('')
const emailCaptchaUrl = ref('')
const emailCaptchaUuid = ref('')

// 账号密码登录表单
const passwordForm = reactive({
  account: '',
  pwd: '',
  kaptChaCode: '',
  uuid: ''
})

// 邮箱验证码登录表单
const emailForm = reactive({
  account: '',
  emailCode: '',
  kaptChaCode: '',
  uuid: ''
})

// 处理账号密码登录
const handlePasswordLogin = async () => {
  if (!passwordForm.account || !passwordForm.pwd || !passwordForm.kaptChaCode) {
    ElMessage.warning('请填写完整信息')
    return
  }

  loading.value = true
  try {
    // 先校验图像验证码
    const isCaptchaValid = await checkCaptcha(passwordForm.kaptChaCode)
    if (!isCaptchaValid) {
      passwordForm.kaptChaCode = ''
      await refreshCaptcha()
      return
    }

    // 确保UUID已设置
    if (!passwordForm.uuid) {
      passwordForm.uuid = captchaUuid.value
    }

    const {code, data} = await api_login(passwordForm)
    if (code === 0) {
      ElMessage.success("登录成功")
      localStorage.setItem("token", data.token)
      localStorage.setItem("userInfo", JSON.stringify(data))
      await $router.push('/')
    } else {
      ElMessage.error('登录失败，请检查账号密码')
      // 登录失败时刷新验证码
      await refreshCaptcha()
    }
  } catch (error) {
    ElMessage.error('网络错误，请检查网络连接后重试')
    // 出错时刷新验证码
    await refreshCaptcha()
  } finally {
    loading.value = false
  }
}

// 处理邮箱验证码登录
const handleEmailLogin = async () => {
  if (!emailForm.account || !emailForm.emailCode || !emailForm.kaptChaCode) {
    ElMessage.warning('请填写完整信息')
    return
  }

  loading.value = true
  try {
    // 先校验图像验证码
    const isCaptchaValid = await checkCaptcha(emailForm.kaptChaCode, emailCaptchaUuid.value)
    if (!isCaptchaValid) {
      ElMessage.error('图像验证码错误，请重新输入')
      emailForm.kaptChaCode = ''
      await refreshEmailCaptcha()
      return
    }

    // 确保UUID已设置
    if (!emailForm.uuid) {
      emailForm.uuid = emailCaptchaUuid.value
    }
    const {code, data} = await api_email_login(emailForm)
    if (code === 0) {
      ElMessage.success("登录成功")
      localStorage.setItem("token", data.token)
      localStorage.setItem("userInfo", JSON.stringify(data))
      await $router.push('/')
    } else {
      ElMessage.error('登录失败，请检查信息')
      // 登录失败时刷新验证码
      await refreshEmailCaptcha()
    }
  } catch (error) {
    ElMessage.error('网络错误，请检查网络连接后重试')
    // 出错时刷新验证码
    await refreshEmailCaptcha()
  } finally {
    loading.value = false
  }
}

// 发送验证码
const sendCode = async () => {
  if (!emailForm.account) {
    ElMessage.warning('请先输入邮箱地址')
    return
  }

  if (!isValidEmail(emailForm.account)) {
    ElMessage.warning('请输入有效的邮箱地址')
    return
  }

  if (!emailForm.kaptChaCode) {
    ElMessage.warning('请先输入图像验证码')
    return
  }
  try {
     const isCaptchaValid = await checkCaptcha(emailForm.kaptChaCode, emailCaptchaUuid.value)
     if (!isCaptchaValid) {
       emailForm.kaptChaCode = ''
       await refreshEmailCaptcha()
       return
     }

    // 确保UUID已设置
    if (!emailForm.uuid) {
      emailForm.uuid = emailCaptchaUuid.value
    }

    const sendEmailParams = {
      email: emailForm.account,
      kaptChaCode: emailForm.kaptChaCode,
      uuid: emailForm.uuid
    }

    const {code} = await api_send_email(sendEmailParams)
    if (code === 0) {
      ElMessage.success("发送成功")
    }
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    ElMessage.error('发送失败，请稍后重试')
  }
}

// 刷新图像验证码
const refreshCaptcha = async () => {
  try {
    captchaUuid.value = generateUUID()
    passwordForm.uuid = captchaUuid.value // 设置UUID到表单
    const {code,msg} = await api_getImg_code(captchaUuid.value)
    if (code === 0 && msg) {
      captchaUrl.value = `data:image/jpeg;base64,${msg}`
    }
  } catch (error) {
    ElMessage.error('获取验证码失败，请重试')
  }
}

// 刷新邮箱登录的图像验证码
const refreshEmailCaptcha = async () => {
  try {
    emailCaptchaUuid.value = generateUUID()
    emailForm.uuid = emailCaptchaUuid.value // 设置UUID到表单
    const {code,msg} = await api_getImg_code(emailCaptchaUuid.value)
    if (code === 0 && msg) {
      emailCaptchaUrl.value = `data:image/jpeg;base64,${msg}`
    }
  } catch (error) {
    ElMessage.error('获取验证码失败，请重试')
  }
}

// 校验图像验证码
const checkCaptcha = async (code: string, uuid?: string): Promise<boolean> => {
  try {
    const targetUuid = uuid || captchaUuid.value
    const response = await api_check_code(targetUuid, code)
    return response.code === 0
  } catch (error) {
    return false
  }
}

// 生成UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 验证邮箱格式
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 组件挂载时初始化验证码
onMounted(async () => {
  await refreshCaptcha()
  await refreshEmailCaptcha()
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  color: #333;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.login-header p {
  color: #666;
  font-size: 14px;
}

.login-tabs {
  display: flex;
  background: #f5f5f5;
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 30px;
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
}

.tab-btn.active {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.login-form {
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.password-input,
.code-input {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input input,
.code-input input {
  flex: 1;
  margin-right: 10px;
}

.password-toggle,
.send-code-btn {
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.password-toggle:hover,
.send-code-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.send-code-btn:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

/* 验证码输入框样式 */
.captcha-input {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}

.captcha-input input {
  flex: 1;
  margin-right: 0;
}

.captcha-image {
  width: 100px;
  height: 40px;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  background: #f8f9fa;
}

.captcha-image:hover {
  border-color: #667eea;
}

.captcha-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-loading {
  color: #666;
  font-size: 12px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.forgot-link {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
}

.forgot-link:hover {
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.other-login {
  margin-bottom: 20px;
}

.divider {
  position: relative;
  text-align: center;
  margin: 20px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e1e5e9;
}

.divider span {
  background: white;
  padding: 0 15px;
  color: #666;
  font-size: 14px;
}

.social-login {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.social-btn {
  flex: 1;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.social-btn.wechat:hover {
  border-color: #07c160;
  color: #07c160;
}

.social-btn.qq:hover {
  border-color: #12b7f5;
  color: #12b7f5;
}

.register-link {
  text-align: center;
  font-size: 14px;
  color: #666;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}

.help-text {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
    margin: 10px;
  }

  .login-header h1 {
    font-size: 24px;
  }

  .social-login {
    flex-direction: column;
  }

  .tab-btn {
    padding: 10px 12px;
    font-size: 13px;
  }
}
</style>

