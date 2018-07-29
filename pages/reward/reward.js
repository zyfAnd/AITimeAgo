// pages/reward/reward.js
Page({
    handleRewardQr() {
        wx.previewImage({
          urls: ["http://ouk8myx67.bkt.clouddn.com/weixingongzhonghao.jpg"]
        })
    },
    navigate: function () {
      wx.navigateToMiniProgram({
        appId: 'wxb45a70e3ec3a8fa4',
        extraData: {
          foo: 'bar'
        },
        envVersion: 'develop',
        success(res) {
          // 打开成功
        }
      })
    }
})