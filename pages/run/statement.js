// pages/run/statement.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    polyline: [{
      points: [],
      color: "#07c160",
      width: 2
    }],
    latitude: 0,
    longitude: 0,
    time_data: "00:00",
    distance_data: "0.00",
    speed_data: "0:00",
    kcal_data: "0.00",
    km_speed_data: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '运动结算',
    })
    let id = options.id;
    let run_info = JSON.parse(wx.getStorageSync('RunInfo-' + id));
    
    // 检查并修复配速格式
    if (!run_info.speed_data || 
        run_info.speed_data.includes("Infinity") || 
        run_info.speed_data.includes("NaN") || 
        run_info.speed_data === "NaN:NaN") {
      run_info.speed_data = "0:00";
    }
    
    // 检查并修复每公里配速数据
    if (run_info.km_speed_data) {
      run_info.km_speed_data = run_info.km_speed_data.map(s => {
        if (!s || s.includes("Infinity") || s.includes("NaN") || s === "NaN:NaN") {
          return "0:00";
        }
        return s;
      });
    } else {
      run_info.km_speed_data = [];
    }
    
    // 检查并修复距离
    if (!run_info.distance_data || isNaN(parseFloat(run_info.distance_data))) {
      run_info.distance_data = "0.00";
    }
    
    // 检查并修复卡路里
    if (!run_info.kcal_data || isNaN(parseFloat(run_info.kcal_data))) {
      run_info.kcal_data = "0.00";
    }
    
    // 检查并修复时间
    if (!run_info.time_data || run_info.time_data.includes("NaN")) {
      run_info.time_data = "00:00:00";
    }
    
    console.log('加载运动数据:', run_info);
    
    // 格式化配速
    let formattedSpeed = this.formatPace(run_info.speed_data);
    let formattedKmSpeeds = [];
    
    if (run_info.km_speed_data && Array.isArray(run_info.km_speed_data)) {
      formattedKmSpeeds = run_info.km_speed_data.map(s => this.formatPace(s));
    }
    
    // 获取轨迹点
    let points_data = [];
    if (run_info.points_data && Array.isArray(run_info.points_data)) {
      points_data = run_info.points_data;
    }
    
    let sub_obj = "polyline[0].points";
    
    this.setData({
      id: options.id,
      time_data: run_info.time_data,
      distance_data: run_info.distance_data,
      speed_data: formattedSpeed,
      kcal_data: run_info.kcal_data,
      km_speed_data: formattedKmSpeeds,
      runType: run_info.runType,
      [sub_obj]: points_data
    });
    
    let that = this;
    wx.getLocation({
      success(res) {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude
        });
        setTimeout(function () {
          let obj = wx.createMapContext('myMap');
          obj.moveToLocation();
        }, 2000);
      }
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },
  
  // 格式化配速显示
  formatPace: function(paceString) {
    if (!paceString || 
        paceString.includes("Infinity") || 
        paceString.includes("NaN") || 
        paceString === "NaN:NaN") {
      return "0:00";
    }
    
    // 如果是旧格式（带引号），转换为新格式
    if (paceString.includes("'") && paceString.includes("\"")) {
      try {
        const parts = paceString.split("'");
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1].replace("\"", "")) || 0;
        return minutes + ":" + seconds.toString().padStart(2, '0');
      } catch (e) {
        console.error('配速格式转换错误:', e);
        return "0:00";
      }
    }
    
    return paceString;
  },
  
  toDetail() {
    this.vibrateFunc(1);
    let id = this.data.id;
    wx.navigateTo({
      url: '../history/detail?id=' + id,
    })
  },
  
  toShare() {
    this.vibrateFunc(1)
    let id = this.data.id;
    wx.navigateTo({
      url: '../share/index?id='+id,
    })
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

  // 添加计算配速条高度的方法
  calculateBarHeight: function(paceString) {
    if (!paceString || paceString === "0:00") return 0;
    
    try {
      const parts = paceString.split(':');
      const minutes = parseInt(parts[0]);
      const seconds = parseInt(parts[1]);
      
      // 计算总秒数
      const totalSeconds = minutes * 60 + seconds;
      
      // 配速越快，高度越高（反向计算）
      // 假设7分钟配速是0%高度，3分钟配速是100%高度
      const maxSeconds = 7 * 60; // 7分钟
      const minSeconds = 3 * 60; // 3分钟
      
      if (totalSeconds >= maxSeconds) return 0;
      if (totalSeconds <= minSeconds) return 100;
      
      // 线性映射到0-100%
      return Math.round(100 - ((totalSeconds - minSeconds) / (maxSeconds - minSeconds) * 100));
    } catch (e) {
      console.error('计算配速条高度错误:', e);
      return 0;
    }
  }
})