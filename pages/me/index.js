// pages/me/index.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {
      nickName: "lebu"
    }
  },
  getUserInfo() {
    wx.getUserProfile({
      desc: '用于设置页显示昵称与头像',
    }).then(res => {
      if (res.errMsg == "getUserProfile:ok") {
        console.log("* 用户同意授权UserInfo");
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
        wx.setStorageSync('userInfo', res.userInfo);
      } else {
        console.warn("* 用户拒绝授权UserInfo");
      }
    });
  },
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '我',
    })
    if (wx.getStorageInfoSync().keys.indexOf("userInfo") != -1) {
      let userInfo = wx.getStorageSync("userInfo");
      this.setData({
        userInfo: userInfo,
      })
    }
  },
  click() {
    this.vibrateFunc(1);
  },
  vibrateFunc(mode) {
    if (wx.getStorageSync('vibrate')) {
      if (mode == 1) {
        wx.vibrateShort({
          complete: (res) => {},
        })
      }

      if (mode == 2) {
        wx.vibrateLong({
          complete: (res) => {},
        })
      }
    }
  },
  onShow: function() {
    // 设置自定义 TabBar 的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        value: 'me'
      });
    }
  },
})