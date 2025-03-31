Page({
  data: {
    avatarUrl: '/icon/avatar-default.jpg',
    userInfo: {
      nickName: ''
    },
    isEditingNickname: false
  },
  onLoad(options) {
    // 尝试获取已保存的头像和昵称
    const avatarUrl = wx.getStorageSync('avatarUrl');
    const nickName = wx.getStorageSync('nickName');
    
    if (avatarUrl) {
      this.setData({ avatarUrl });
    }
    
    if (nickName) {
      this.setData({ 
        userInfo: {
          nickName: nickName
        }
      });
    }
  },
  getUserProfile: function() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          avatarUrl: res.userInfo.avatarUrl
        });
        
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
          const parsedInfo = JSON.parse(userInfo);
          parsedInfo.avatarUrl = res.userInfo.avatarUrl;
          wx.setStorageSync('userInfo', JSON.stringify(parsedInfo));
        } else {
          wx.setStorageSync('userInfo', JSON.stringify(res.userInfo));
        }
      },
      fail: (err) => {
        console.log('获取用户信息失败', err);
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
      }
    });
  },
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({
      avatarUrl,
    });
    
    // 保存头像到本地存储
    wx.setStorageSync('avatarUrl', avatarUrl);
  },
  onInputNickname(e) {
    this.setData({
      'userInfo.nickName': e.detail.value
    });
  },
  redirect() {
    // 确保昵称已保存
    if (this.data.userInfo.nickName) {
      wx.setStorageSync('nickName', this.data.userInfo.nickName);
    }
    
    wx.redirectTo({
      url: './setting',
    });
  },
  vibrateFunc(mode) {
    if(wx.getStorageSync('vibrate')){
      if(mode == 1){
        wx.vibrateShort({
          complete: (res) => {},
        })
      }

      if(mode == 2){
        wx.vibrateLong({
          complete: (res) => {},
        })
      }
    }
  },
  onNicknameBlur(e) {
    console.log('昵称输入框失焦', e.detail.value);
  },
  toggleNicknameEdit() {
    this.setData({
      isEditingNickname: !this.data.isEditingNickname
    });
  },
  submitNickname(e) {
    const nickName = e.detail.value.nickname || '追风者-小帅';
    this.setData({
      'userInfo.nickName': nickName,
      isEditingNickname: false
    });
    
    // 保存昵称到本地存储
    wx.setStorageSync('nickName', nickName);
  },
})