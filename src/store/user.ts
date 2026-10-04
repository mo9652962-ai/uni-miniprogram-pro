import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface UserInfo {
  nickName: string
  avatarUrl: string
  openid?: string
  role?: string
}

export const useUserStore = defineStore('user', () => {
  // 从本地同步缓存读取初始 token
  const token = ref<string>(uni.getStorageSync('access_token') || '')
  
  const userInfo = ref<UserInfo>(
    uni.getStorageSync('user_info') 
      ? JSON.parse(uni.getStorageSync('user_info'))
      : {
          nickName: '游客',
          avatarUrl: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
        }
  )

  const isLogin = ref<boolean>(!!token.value)

  /**
   * 设置登录态
   */
  const setToken = (newToken: string) => {
    token.value = newToken
    isLogin.value = !!newToken
    uni.setStorageSync('access_token', newToken)
  }

  /**
   * 更新用户信息
   */
  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info
    uni.setStorageSync('user_info', JSON.stringify(info))
  }

  /**
   * 退出登录
   */
  const logout = () => {
    token.value = ''
    isLogin.value = false
    userInfo.value = {
      nickName: '游客',
      avatarUrl: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
    }
    uni.removeStorageSync('access_token')
    uni.removeStorageSync('user_info')
    uni.showToast({
      title: '已退出登录',
      icon: 'none'
    })
  }

  return {
    token,
    userInfo,
    isLogin,
    setToken,
    setUserInfo,
    logout
  }
})
