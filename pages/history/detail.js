import uCharts from '../../utils/u-charts.min';
var _self;
var canvaLineA = null;
var canvaLineB = null;
Page({
  data: {
    cWidth: 0,
    cHeight: 0,
    polyline: [{
      points: [],
      color: "#07c160",
      width: 2
    }],
    latitude: 0,
    longitude: 0,
    time_data: "00:00",
    distance_data: "0.00",
    speed_data: "0'00\"",
    kcal_data: "0.00",
    runType: 0,
    date: "",
    time: "",
    startLocation: "未知",
    endLocation: "未知",
    maxAltitude: "0",
    minAltitude: "0"
  },
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '运动详情',
    })
    _self = this;
    this.cWidth = wx.getSystemInfoSync().windowWidth;
    this.cHeight = 300 * (wx.getSystemInfoSync().windowWidth / 750)
    if (JSON.stringify(options) == "{}") {
      wx.showModal({
        title: '提示',
        content: '参数传递错误',
        showCancel: false,
        success(res) {
          if (res.confirm) {
            wx.redirectTo({
              url: './index',
            })
          }
        }
      })
    }
    this.data.id = options.id;
    let run_data = JSON.parse(wx.getStorageSync('RunInfo-' + options.id));
    
    // 格式化配速数据
    let time_data = run_data.time_data;
    let distance_data = run_data.distance_data;
    let kcal_data = run_data.kcal_data;
    let points_data = run_data.points_data || [];
    let km_speed_data = run_data.km_speed_data || [];
    let altitude = run_data.altitude || 0;
    let altitude_data = run_data.altitude_data || [];
    
    // 检查并修复配速格式
    if (run_data.speed_data && 
        (run_data.speed_data.includes("Infinity") || 
         run_data.speed_data.includes("NaN") || 
         run_data.speed_data === "NaN:NaN")) {
      run_data.speed_data = "0:00";
    }
    
    // 格式化配速
    let speed_data = this.formatPace(run_data.speed_data);
    
    // 格式化每公里配速
    let formattedKmSpeeds = [];
    if (km_speed_data && Array.isArray(km_speed_data)) {
      formattedKmSpeeds = km_speed_data.map(s => this.formatPace(s));
    }
    
    // 设置日期和时间
    const timestamp = parseInt(options.id);
    const date = new Date(timestamp * 1000);
    const dateStr = date.getFullYear() + '-' + 
                   (date.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                   date.getDate().toString().padStart(2, '0');
    const timeStr = date.getHours().toString().padStart(2, '0') + ':' + 
                   date.getMinutes().toString().padStart(2, '0');
    
    // 计算海拔数据
    let maxAlt = 0;
    let minAlt = 10000;
    if (altitude_data && altitude_data.length > 0) {
      for (let i = 0; i < altitude_data.length; i++) {
        const alt = parseFloat(altitude_data[i]);
        if (!isNaN(alt)) {
          maxAlt = Math.max(maxAlt, alt);
          minAlt = Math.min(minAlt, alt);
        }
      }
    }
    
    // 如果没有有效的海拔数据
    if (minAlt === 10000) minAlt = 0;
    
    let run_type = run_data.runType;
    if(isNaN(run_type)) run_type = 0;
    
    if(points_data.length > 0){
      this.setData({
        longitude: points_data[points_data.length - 1].longitude,
        latitude: points_data[points_data.length - 1].latitude
      });
    }
    
    let sub_obj = "polyline[" + 0 + "].points";
    this.setData({
      id: options.id,
      time_data: time_data,
      distance_data: distance_data,
      speed_data: speed_data,
      kcal_data: kcal_data,
      [sub_obj]: points_data,
      km_speed_data: formattedKmSpeeds,
      altitude_data: altitude_data,
      runType: run_type,
      date: dateStr,
      time: timeStr,
      maxAltitude: maxAlt.toFixed(0),
      minAltitude: minAlt.toFixed(0)
    });
    
    let that = this;
    wx.getLocation({
      type: 'gcj02',
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
    
    // 如果有配速数据，绘制图表
    if (formattedKmSpeeds && formattedKmSpeeds.length > 0) {
      this.drawCharts(formattedKmSpeeds);
    }
  },
  
  // 格式化配速
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
  
  // 绘制图表
  drawCharts: function(kmSpeedData) {
    // 准备配速图表数据
    let km_series = [];
    let km_categories = [];
    
    for (let i = 0; i < kmSpeedData.length; i++) {
      let pace = kmSpeedData[i];
      if (pace === "0:00") continue;
      
      try {
        const parts = pace.split(':');
        const minutes = parseInt(parts[0]);
        const seconds = parseInt(parts[1]);
        const totalSeconds = minutes * 60 + seconds;
        
        km_series.push(totalSeconds);
        km_categories.push((i + 1) + "km");
      } catch (e) {
        console.error('解析配速错误:', e, pace);
      }
    }
    
    // 如果没有有效数据，不绘制图表
    if (km_series.length === 0) return;
    
    // 绘制配速图表
    canvaLineA = new uCharts({
      $this: _self,
      canvasId: 'canvasLineA',
      type: 'line',
      fontSize: 11,
      legend: {
        show: false
      },
      dataLabel: true,
      dataPointShape: true,
      background: '#FFFFFF',
      pixelRatio: 1,
      categories: km_categories,
      series: [{
        name: "配速",
        data: km_series,
        format: function(val) {
          const minutes = Math.floor(val / 60);
          const seconds = Math.floor(val % 60);
          return minutes + ":" + seconds.toString().padStart(2, '0');
        }
      }],
      xAxis: {
        disableGrid: true,
        fontColor: '#666666'
      },
      yAxis: {
        gridType: 'dash',
        dashLength: 2,
        data: [{
          min: 0,
          max: 600,
          format: function(val) {
            const minutes = Math.floor(val / 60);
            const seconds = Math.floor(val % 60);
            return minutes + ":" + seconds.toString().padStart(2, '0');
          }
        }]
      },
      width: _self.cWidth,
      height: _self.cHeight,
      extra: {
        line: {
          type: 'curve',
          width: 2,
          color: '#0052d9'
        }
      }
    });
  },
  
  touchLineA(e) {
    canvaLineA.scrollStart(e);
  },
  moveLineA(e) {
    canvaLineA.scroll(e);
  },
  touchEndLineA(e) {
    canvaLineA.scrollEnd(e);
    //下面是toolTip事件，如果滚动后不需要显示，可不填写
    canvaLineA.showToolTip(e, {
      format: function (item, category) {
        const minutes = Math.floor(item.data / 60);
        const seconds = Math.floor(item.data % 60);
        return category + ' 配速: ' + minutes + ":" + seconds.toString().padStart(2, '0');
      }
    });
  },
  
  // 计算配速条高度
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
  },
  
  // 删除记录
  deleteRecord: function() {
    this.vibrateFunc(1);
    const that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条运动记录吗？',
      confirmColor: '#ff4d4f',
      success(res) {
        if (res.confirm) {
          // 删除记录的逻辑
          wx.removeStorageSync('RunInfo-' + that.data.id);
          wx.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 2000
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 2000);
        }
      }
    });
  },
  
  // 分享记录
  shareRecord: function() {
    this.vibrateFunc(1);
    const id = this.data.id;
    wx.navigateTo({
      url: '../share/index?id=' + id,
    });
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
  }
})