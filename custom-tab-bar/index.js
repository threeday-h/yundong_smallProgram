Component({
  data: {
    value: 'index',
    list: [
      {
        value: 'index',
        icon: 'home',
        ariaLabel: '跑步',
        pagePath: '/pages/index/index'
      },
      {
        value: 'me',
        icon: 'user',
        ariaLabel: '我的',
        pagePath: '/pages/me/index'
      }
    ],
  },
  methods: {
    onChange(e) {
      const value = e.detail.value;
      this.setData({ value });
      
      // 找到对应的页面路径
      const tabItem = this.data.list.find(item => item.value === value);
      if (tabItem) {
        wx.switchTab({
          url: tabItem.pagePath
        });
      }
    }
  }
}); 