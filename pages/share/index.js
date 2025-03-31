// pages/share/index.js
const app = getApp()
var greycolor = '#969696';
var maincolor = '#fff';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    qtsheXcxCode: "../../icon/qrcode.png",
    shareImagePath: "../../icon",
    qtsheBackground: "../../icon/bg.png",
    timeStamp: 0,
    run_data: null,
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
    currentDate: '',
    screenHeight: 0,
    screenWidth: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '分享成就',
    })
    
    // 获取设备信息
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      screenHeight: systemInfo.windowHeight,
      screenWidth: systemInfo.windowWidth
    });
    
    // 设置当前日期
    this.setCurrentDate();
    
    if (JSON.stringify(options) == "{}") {
      wx.showModal({
        title: '提示',
        content: '参数传递错误',
        showCancel: false,
        success(res) {
          if (res.confirm) {
            wx.navigateBack()
          }
        }
      })
      return;
    }
    
    let run_data = JSON.parse(wx.getStorageSync('RunInfo-' + options.id));
    
    // 格式化配速数据
    let time_data = run_data.time_data;
    let distance_data = run_data.distance_data;
    let kcal_data = run_data.kcal_data;
    let points_data = run_data.points_data || [];
    let speed_data = run_data.speed_data || "0'00\"";
    let runType = run_data.runType || 0;
    
    // 设置数据
    this.setData({
      time_data: time_data,
      distance_data: distance_data,
      kcal_data: kcal_data,
      speed_data: speed_data,
      runType: runType
    });
    
    // 如果是户外跑，设置地图数据
    if (runType == 0 && points_data.length > 0) {
      let polyline = [{
        points: points_data,
        color: "#07c160",
        width: 4,
        arrowLine: true
      }];
      
      // 创建起点和终点标记
      const startPoint = points_data[0];
      const endPoint = points_data[points_data.length - 1];
      
      const markers = [
        {
          id: 1,
          latitude: startPoint.latitude,
          longitude: startPoint.longitude,
          width: 25,
          height: 25,
          callout: {
            content: '起点',
            color: '#ffffff',
            fontSize: 12,
            borderRadius: 4,
            bgColor: '#0052d9',
            padding: 5,
            display: 'ALWAYS'
          },
          iconPath: '/icon/start-marker.png'
        },
        {
          id: 2,
          latitude: endPoint.latitude,
          longitude: endPoint.longitude,
          width: 25,
          height: 25,
          callout: {
            content: '终点',
            color: '#ffffff',
            fontSize: 12,
            borderRadius: 4,
            bgColor: '#07c160',
            padding: 5,
            display: 'ALWAYS'
          },
          iconPath: '/icon/end-marker.png'
        }
      ];
      
      // 计算地图中心点和缩放级别
      this.setData({
        polyline: polyline,
        latitude: (startPoint.latitude + endPoint.latitude) / 2,
        longitude: (startPoint.longitude + endPoint.longitude) / 2,
        markers: markers
      });
      
      // 延迟一下，确保地图加载完成后再调整视野
      setTimeout(() => {
        const mapCtx = wx.createMapContext('shareMap');
        mapCtx.includePoints({
          points: points_data,
          padding: [80, 80, 80, 80]
        });
      }, 500);
    }

    this.createNewImg();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },



  setTitle() {

  },
  setlocate(cotext) {
    context.drawImage(path, 295, 507, 80, 80)
  },
  //将小程序码绘制到固定位置
  setQrcode(context) {
    let path = this.data.qtsheXcxCode //小程序码
    context.drawImage(path, 205, 20, 80, 80)
  },
  //将canvas转换为图片保存到本地，然后将图片路径传给image图片的src
  createNewImg() {
    let context = wx.createCanvasContext('mycanvas')
    let path = this.data.qtsheBackground
    let that = this
    context.drawImage(path, 0, 0, 300, 300) //以iPhone 6尺寸大小为标准绘制图片
    that.setQrcode(context)

    context.setTextAlign('left');
    context.font = 'bolder 25px sans-serif';
    context.setFillStyle(maincolor);
    context.fillText("活力健身房", 10, 35);
    context.font = 'bolder 15px sans-serif';
    context.fillText("2020", 10, 160);

    context.fillText(this.data.run_data.kcal_data, 10, 220);
    context.fillText(this.data.run_data.distance_data, 120, 220);
    context.fillText(this.data.run_data.speed_data, 10, 260);
    context.fillText(this.data.run_data.time_data, 120, 260);

    context.font = 'bolder 10px sans-serif';
    context.setFillStyle(greycolor);
    context.fillText(this.data.month + "月" + this.data.date + "日 " + this.data.hour + ":" + this.data.minute, 10, 175);
    context.fillText("卡路里(千卡)", 10, 235);
    context.fillText("里程(千米)", 120, 235);
    context.fillText("配速(分/公里)", 10, 275);
    context.fillText("时间", 120, 275);

    // that.setAvatarUrl(context)
    //绘制图片
    context.rect(20, 20, 150, 100);
    context.draw()
    context.save()
    //将生成好的图片保存到本地，需要延迟一会，绘制期间耗时
    setTimeout(() => {
      wx.canvasToTempFilePath({
        canvasId: 'mycanvas',
        success: function (res) {
          wx.hideLoading()
          that.setData({
            shareImagePath: res.tempFilePath
          })
        },
        fail: function (res) {
          console.log(res.errMsg)
        }
      }, this)
    }, 2000)
  },
  savePhoto() {

    this.vibrateFunc(1);
    var that = this

    wx.getSetting({
      success(res) {
        let wpa = res.authSetting["scope.writePhotosAlbum"];

        console.log(res.authSetting)
        if (wpa == false) {
          wx.showModal({
            title: "提示",
            content: "保存照片功能,需要您的相册访问授权,请先授权再使用该功能。",
            confirmText: "授权",
            cancelText: "取消",
            success(res) {
              if (res.confirm) {
                wx.openSetting({})
              } else {
                return;
              }
            }
          })
        } else {
          wx.showLoading({
            title: '正在保存...',
            mask: true
          })
          setTimeout(() => {
            wx.saveImageToPhotosAlbum({
              filePath: that.data.shareImagePath,
              success(res) {
                wx.showToast({
                  title: '保存成功',
                  icon: 'none'
                })
                setTimeout(() => {
                  wx.hideLoading()
                  that.setData({
                    isPhotoModel: false,
                    isCanvas: false
                  })
                }, 1000)
              },
              fail() {
                wx.showToast({
                  title: '保存失败，请刷新页面重试',
                  icon: 'none'
                })
                setTimeout(() => {
                  wx.hideLoading()
                  that.setData({
                    isPhotoModel: false,
                    isCanvas: false
                  })
                }, 1000)
              }
            })
          }, 2500)
        }
      }
    })

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
  // 设置当前日期
  setCurrentDate: function() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    this.setData({
      currentDate: `${year}年${month}月${day}日`
    });
  },
  
  // 保存图片
  saveImage: function() {
    this.vibrateFunc(1);
    
    wx.showLoading({
      title: '保存中...',
    });
    
    // 创建选择器
    const query = wx.createSelectorQuery();
    query.select('.share-card').boundingClientRect();
    query.exec((res) => {
      if (!res[0]) {
        wx.hideLoading();
        wx.showToast({
          title: '生成图片失败',
          icon: 'none'
        });
        return;
      }
      
      const cardHeight = res[0].height;
      const cardWidth = res[0].width;
      
      wx.canvasToTempFilePath({
        x: 0,
        y: 0,
        width: cardWidth,
        height: cardHeight,
        destWidth: cardWidth * 2,
        destHeight: cardHeight * 2,
        canvasId: 'shareCanvas',
        success: (res) => {
          wx.hideLoading();
          // 保存图片到相册
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({
                title: '保存成功',
                icon: 'success'
              });
            },
            fail: (err) => {
              if (err.errMsg.indexOf('auth deny') >= 0) {
                wx.showModal({
                  title: "提示",
                  content: "保存照片功能需要您的相册访问授权，请先授权再使用该功能。",
                  confirmText: "授权",
                  cancelText: "取消",
                  success(res) {
                    if (res.confirm) {
                      wx.openSetting({});
                    }
                  }
                });
              } else {
                wx.showToast({
                  title: '保存失败',
                  icon: 'none'
                });
              }
            }
          });
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('生成图片失败', err);
          wx.showToast({
            title: '生成图片失败',
            icon: 'none'
          });
        }
      });
    });
  },
  
  // 分享给朋友
  onShareAppMessage: function () {
    return {
      title: `我完成了${this.data.distance_data}公里的跑步，用时${this.data.time_data}`,
      path: '/pages/index/index',
      imageUrl: '/icon/share-cover.png'
    }
  }
})