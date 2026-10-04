import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface UserInfo {
  nickName: string
  avatarUrl: string
  openid?: string
  role?: string
  isVip?: boolean
  vipExpireDate?: string
}

export const useUserStore = defineStore('user', () => {
  // 从本地同步缓存读取初始双 Token
  const token = ref<string>(uni.getStorageSync('access_token') || '')
  const refreshToken = ref<string>(uni.getStorageSync('refresh_token') || '')
  
  const userInfo = ref<UserInfo>(
    uni.getStorageSync('user_info') 
      ? JSON.parse(uni.getStorageSync('user_info'))
      : {
          nickName: '游客',
          avatarUrl: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
          isVip: false,
          vipExpireDate: ''
        }
  )

  const isLogin = ref<boolean>(!!token.value)

  /**
   * 设置双 Token 凭据
   */
  const setTokens = (newAccess: string, newRefresh?: string) => {
    token.value = newAccess
    isLogin.value = !!newAccess
    uni.setStorageSync('access_token', newAccess)
    if (newRefresh) {
      refreshToken.value = newRefresh
      uni.setStorageSync('refresh_token', newRefresh)
    }
  }

  /**
   * 兼容单个 setToken
   */
  const setToken = (newAccess: string) => {
    setTokens(newAccess)
  }

  /**
   * 更新用户信息
   */
  const setUserInfo = (info: Partial<UserInfo>) => {
    userInfo.value = { ...userInfo.value, ...info }
    uni.setStorageSync('user_info', JSON.stringify(userInfo.value))
  }

  /**
   * 更新 VIP 会员权益
   */
  const setVipStatus = (isVip: boolean, expireDate: string) => {
    userInfo.value.isVip = isVip
    userInfo.value.vipExpireDate = expireDate
    uni.setStorageSync('user_info', JSON.stringify(userInfo.value))
  }

  /**
   * 退出登录
   */
  const logout = () => {
    token.value = ''
    refreshToken.value = ''
    isLogin.value = false
    userInfo.value = {
      nickName: '游客',
      avatarUrl: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      isVip: false,
      vipExpireDate: ''
    }
    uni.removeStorageSync('access_token')
    uni.removeStorageSync('refresh_token')
    uni.removeStorageSync('user_info')
    uni.showToast({
      title: '已退出登录',
      icon: 'none'
    })
  }

  return {
    token,
    refreshToken,
    userInfo,
    isLogin,
    setTokens,
    setToken,
    setUserInfo,
    setVipStatus,
    logout
  }
})
