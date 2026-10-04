<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { initCloud } from './services/cloud'

/**
 * 模块 2：应用级生命周期链路
 */
onLaunch(() => {
  console.log('🚀 [App LifeCycle] onLaunch: 小程序初始化完成')
  // 初始化云开发环境（双轨之一）
  initCloud()

  // 微信版本冷启动检查与静默更新逻辑
  // #ifdef MP-WEIXIN
  if (uni.canIUse('getUpdateManager')) {
    const updateManager = uni.getUpdateManager()
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        updateManager.onUpdateReady(() => {
          uni.showModal({
            title: '更新提示',
            content: '新版本已就绪，是否重启应用？',
            success: (modalRes) => {
              if (modalRes.confirm) {
                updateManager.applyUpdate()
              }
            }
          })
        })
      }
    })
  }
  // #endif
})

onShow(() => {
  console.log('👀 [App LifeCycle] onShow: 小程序进入前台')
})

onHide(() => {
  console.log('💤 [App LifeCycle] onHide: 小程序进入后台')
})
</script>

<style lang="scss">
/* 全局页面通用重置与变量 */
page {
  background-color: #f6f7fb;
  color: #333333;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
  box-sizing: border-box;
}

view, text, image {
  box-sizing: border-box;
}
</style>
