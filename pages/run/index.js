// pages/run/index.js
// import timer from "../../utils/lebu-timer";  // 注释掉这一行
import lebu from "../../utils/lebu-core";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    _msg: '反编译的人,我是你爹,NMSL',
    screenHeight: 0,
    polyline: [{
      points: [],
      color: "#07c160",
      width: 2
    }],
    latitude: 0,
    longitude: 0,
    altitude_data: [],
    time_data: "00:00:00",
    kcal_data: "0.00",
    speed_data: "0'00\"",
    distance_data: "0.00",
    motion_status: 0,
    time_id: 0,
    points_time: parseInt(Date.now() / 1000),
    km_speed_data: [],
    km_distance_data: 0,
    runType: 0,
    startTime: 0,
    elapsedTime: 0,
    timerRunning: false,
    lastUpdateTime: 0,
    animationFrameId: null,
    accelerometerAvailable: true,
    simulatedDataIntervalId: null
  },
  tabSelect(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      runType: parseInt(id)
    });
    console.log('切换到跑步模式:', this.data.runType);
    
    // 如果切换到户外跑，初始化地图
    if (this.data.runType == 0) {
      this.initRun();
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查加速度计权限
    this.checkAccelerometerPermission();
    
    this.initRun();
    if (this.data.runType == 0) {
      let sub_obj = "polyline[" + 0 + "].points"
      wx.onLocationChange((result) => {
        //let ex_steps = result.steps;//获取定位步数
        //lebu.setSteps(ex_steps);
        let points = this.data.polyline[0].points;
        //检测距离
        if (this.data.polyline[0].points.length == 0 || this.checkDistance(result.latitude, result.longitude, parseInt(Date.now() / 1000))) {
          points.push({
            longitude: result.longitude,
            latitude: result.latitude
          });
          this.setData({
            [sub_obj]: points,
            longitude: result.longitude,
            latitude: result.latitude,
          });
        }
      })
    }
    console.log('页面加载完成，初始 motion_status:', this.data.motion_status);
  },
  initRun() {
    let sex = wx.getStorageSync('sex');
    let weight = wx.getStorageSync('weight');
    let height = wx.getStorageSync('height');
    if (sex) {
      //男性
      weight = 60;
      height = 172;
    } else {
      //女性
      weight = 52;
      height = 166;
    }
    lebu.setWeight(weight);
    lebu.setHeight(height);
    let that = this;
    if (this.data.runType == 0) {
      wx.getLocation({
        altitude: true,
        success(res) {

          that.setData({
            latitude: res.latitude,
            longitude: res.longitude,
            altitude: res.altitude,
          })

          setTimeout(function () {
            let obj = wx.createMapContext('myMap')
            obj.moveToLocation();
          }, 1000);
        },
        fail() {
          that.checkLocation();
        }
      });
    }
  },
  startRun: function() {
    console.log('开始按钮被点击');
    
    // 显示提示，让用户知道跑步已开始
    wx.showToast({
      title: '开始运动',
      icon: 'success',
      duration: 1000
    });
    
    // 重置并初始化数据
    this.resetRunData();
    
    // 更新状态
    this.setData({
      motion_status: 1,
      startTime: Date.now(),
      elapsedTime: 0,
      timerRunning: true,
      lastUpdateTime: Date.now()
    }, () => {
      console.log('状态已更新为:', this.data.motion_status);
      
      // 立即更新一次时间显示
      this.updateTimeDisplay();
      
      // 启动高精度计时器
      this.startHighPrecisionTimer();
      
      // 如果是户外跑，开始获取位置
      if (this.data.runType === 0) {
        this.startHighPrecisionLocationTracking();
      } else {
        // 室内跑模式，启动高精度加速度计
        this.startHighPrecisionAccelerometer();
      }
    });
  },
  resetRunData: function() {
    // 重置 lebu 核心模块
    lebu.reset();
    
    // 清除可能存在的旧定时器
    if (this.data.time_id) {
      clearInterval(this.data.time_id);
    }
    
    if (this.animationFrameId) {
      clearTimeout(this.animationFrameId);
    }
    
    // 重置数据
    this.setData({
      time_data: "00:00:00",
      distance_data: "0.00",
      kcal_data: "0.00",
      speed_data: "0'00\"",
      km_speed_data: [],
      km_distance_data: 0,
      startTime: 0,
      elapsedTime: 0,
      timerRunning: false
    });
  },
  startHighPrecisionTimer: function() {
    // 使用 setTimeout 代替 requestAnimationFrame
    const updateTimer = () => {
      if (!this.data.timerRunning) return;
      
      // 更新时间显示
      this.updateTimeDisplay();
      
      // 继续下一次更新 (模拟 requestAnimationFrame，约60fps)
      this.animationFrameId = setTimeout(updateTimer, 16);
    };
    
    // 启动计时器
    this.animationFrameId = setTimeout(updateTimer, 16);
    
    // 同时使用 setInterval 作为备份，确保数据更新
    const time_id = setInterval(() => {
      if (!this.data.timerRunning) return;
      
      // 更新运动数据（距离、卡路里等）
      this.updateRunningData();
    }, 500); // 每500ms更新一次数据，提高灵敏度
    
    // 保存定时器ID
    this.setData({
      time_id: time_id
    });
  },
  updateTimeDisplay: function() {
    const now = Date.now();
    const elapsed = now - this.data.startTime + this.data.elapsedTime;
    
    // 转换为时:分:秒格式
    const totalSeconds = Math.floor(elapsed / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);
    
    const timeString = 
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // 只有当时间变化时才更新UI，减少不必要的渲染
    if (this.data.time_data !== timeString) {
      this.setData({
        time_data: timeString
      });
    }
    
    return timeString;
  },
  updateRunningData: function() {
    try {
      const now = Date.now();
      const timeDiff = (now - this.data.lastUpdateTime) / 1000; // 转换为秒
      
      // 获取最新的运动数据
      let distance = lebu.getDistance();
      let kcal = lebu.getKcal();
      
      // 计算当前时间字符串
      const timeString = this.updateTimeDisplay();
      
      // 计算配速 - 只在距离变化时更新
      let speed = lebu.updatePace(timeString);
      
      // 确保配速格式正确
      if (!speed || typeof speed !== 'string' || speed.includes("Infinity") || speed.includes("NaN") || speed === "NaN:NaN") {
        speed = "0:00";
      }
      
      // 确保距离和卡路里是有效数字
      if (isNaN(distance)) distance = 0;
      if (isNaN(kcal)) kcal = 0;
      
      // 应用平滑过滤，减少数据抖动
      distance = this.smoothData(distance, this.data.distance_data, timeDiff);
      kcal = this.smoothData(kcal, this.data.kcal_data, timeDiff);
      
      console.log('更新运动数据 - 距离:', distance, '卡路里:', kcal, '配速:', speed);
      
      // 更新UI
      this.setData({
        distance_data: distance.toFixed(2),
        kcal_data: kcal.toFixed(2),
        speed_data: speed,
        lastUpdateTime: now
      });
      
      // 检查是否完成了1公里，记录配速
      if (distance - this.data.km_distance_data >= 1) {
        let obj = this.data.km_speed_data || [];
        // 确保配速有效
        if (speed && !speed.includes("Infinity") && !speed.includes("NaN") && speed !== "NaN:NaN") {
          obj.push(speed);
          this.setData({
            km_distance_data: Math.floor(distance),
            km_speed_data: obj
          });
          console.log('完成1公里，记录配速:', speed);
        }
      }
    } catch (e) {
      console.error('更新运动数据错误:', e);
    }
  },
  smoothData: function(newValue, oldValue, timeDiff) {
    // 将字符串转换为数字
    if (typeof oldValue === 'string') {
      oldValue = parseFloat(oldValue);
    }
    
    // 计算合理的变化范围
    const maxChange = timeDiff * 0.5; // 每秒最大变化0.5单位
    
    // 如果变化太大，进行限制
    if (Math.abs(newValue - oldValue) > maxChange) {
      if (newValue > oldValue) {
        return oldValue + maxChange;
      } else {
        return oldValue - maxChange;
      }
    }
    
    return newValue;
  },
  startHighPrecisionLocationTracking: function() {
    // 设置高精度位置跟踪
    wx.startLocationUpdate({
      type: 'gcj02',
      success: (res) => {
        console.log('位置跟踪已启动');
      },
      fail: (err) => {
        console.error('位置跟踪启动失败:', err);
        // 提示用户
        wx.showToast({
          title: '请开启位置权限',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },
  startHighPrecisionAccelerometer: function() {
    console.log('启动加速度计...');
    
    // 先检查设备是否支持加速度计
    wx.getSetting({
      success: (res) => {
        console.log('获取设置:', res);
        
        // 尝试启动加速度计
        this.tryStartAccelerometer();
      },
      fail: (err) => {
        console.error('获取设置失败:', err);
        wx.showToast({
          title: '无法获取设备权限',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },
  tryStartAccelerometer: function() {
    // 先停止可能已存在的加速度计
    wx.stopAccelerometer({
      complete: () => {
        console.log('尝试启动加速度计...');
        
        // 使用较低的精度先尝试启动
        wx.startAccelerometer({
          interval: 'normal', // 先使用普通精度
          success: () => {
            console.log('加速度计启动成功(普通精度)');
            
            // 设置加速度数据处理
            this.setupAccelerometerListener();
            
            // 尝试提高精度
            setTimeout(() => {
              wx.stopAccelerometer({
                complete: () => {
                  wx.startAccelerometer({
                    interval: 'game',
                    success: () => {
                      console.log('加速度计精度提升至游戏级');
                    },
                    fail: (err) => {
                      console.log('提升精度失败，保持普通精度:', err);
                    }
                  });
                }
              });
            }, 1000);
          },
          fail: (err) => {
            console.error('加速度计启动失败:', err);
            
            // 尝试使用最低精度
            wx.startAccelerometer({
              interval: 'ui',
              success: () => {
                console.log('加速度计启动成功(UI精度)');
                this.setupAccelerometerListener();
              },
              fail: (finalErr) => {
                console.error('加速度计启动完全失败:', finalErr);
                wx.showToast({
                  title: '加速度计启动失败，请检查设备',
                  icon: 'none',
                  duration: 2000
                });
                
                // 使用模拟数据模式
                this.startSimulatedMode();
              }
            });
          }
        });
      }
    });
  },
  setupAccelerometerListener: function() {
    // 移除可能存在的旧监听器
    wx.offAccelerometerChange();
    
    // 设置新的监听器
    wx.onAccelerometerChange((res) => {
      if (this.data.motion_status !== 1) return;
      
      // 使用卡尔曼滤波处理加速度数据，减少噪声
      const filteredData = this.filterAccelerometerData(res);
      
      // 更新运动数据
      lebu.updateMotion(filteredData.x, filteredData.y, filteredData.z);
    });
  },
  filterAccelerometerData: function(data) {
    // 简单的移动平均滤波
    if (!this.accelDataBuffer) {
      this.accelDataBuffer = {
        x: [data.x],
        y: [data.y],
        z: [data.z]
      };
    } else {
      // 添加新数据
      this.accelDataBuffer.x.push(data.x);
      this.accelDataBuffer.y.push(data.y);
      this.accelDataBuffer.z.push(data.z);
      
      // 保持缓冲区大小
      if (this.accelDataBuffer.x.length > 5) {
        this.accelDataBuffer.x.shift();
        this.accelDataBuffer.y.shift();
        this.accelDataBuffer.z.shift();
      }
    }
    
    // 计算平均值
    const avgX = this.accelDataBuffer.x.reduce((a, b) => a + b, 0) / this.accelDataBuffer.x.length;
    const avgY = this.accelDataBuffer.y.reduce((a, b) => a + b, 0) / this.accelDataBuffer.y.length;
    const avgZ = this.accelDataBuffer.z.reduce((a, b) => a + b, 0) / this.accelDataBuffer.z.length;
    
    return { x: avgX, y: avgY, z: avgZ };
  },
  startSimulatedMode: function() {
    console.log('启动模拟数据模式');
    wx.showToast({
      title: '使用模拟数据模式',
      icon: 'none',
      duration: 2000
    });
    
    // 设置模拟数据定时器
    const simulatedDataInterval = setInterval(() => {
      if (!this.data.timerRunning) {
        clearInterval(simulatedDataInterval);
        return;
      }
      
      // 生成模拟的加速度数据
      const simulatedX = Math.sin(Date.now() / 500) * 0.5;
      const simulatedY = Math.cos(Date.now() / 700) * 0.3;
      const simulatedZ = 9.8 + Math.sin(Date.now() / 300) * 0.7;
      
      // 更新运动数据
      lebu.updateMotion(simulatedX, simulatedY, simulatedZ);
    }, 100);
    
    // 保存定时器ID以便后续清除
    this.simulatedDataIntervalId = simulatedDataInterval;
  },
  pauseRun: function() {
    this.vibrateFunc(1);
    
    // 停止计时器
    if (this.data.timerRunning) {
      const now = Date.now();
      const additionalElapsed = now - this.data.startTime;
      
      this.setData({
        timerRunning: false,
        elapsedTime: this.data.elapsedTime + additionalElapsed
      });
    }
    
    // 取消动画帧 (使用 clearTimeout 代替 cancelAnimationFrame)
    if (this.animationFrameId) {
      clearTimeout(this.animationFrameId);
    }
    
    // 清除定时器
    if (this.data.time_id) {
      clearInterval(this.data.time_id);
      this.setData({
        time_id: 0
      });
    }
    
    // 清除模拟数据定时器
    if (this.simulatedDataIntervalId) {
      clearInterval(this.simulatedDataIntervalId);
    }
    
    // 停止位置更新
    if (this.data.runType == 0) {
      wx.stopLocationUpdate({
        complete: (res) => {}
      });
    }
    
    // 停止加速度计
    wx.stopAccelerometer({
      complete: (res) => {
        this.setData({
          motion_status: 2
        });
      }
    });
  },
  reRun: function() {
    this.vibrateFunc(1);
    
    // 重新开始计时
    if (!this.data.timerRunning) {
      this.setData({
        startTime: Date.now(),
        timerRunning: true
      });
      
      // 重新启动计时器
      this.startHighPrecisionTimer();
    }
    
    // 重新启动位置跟踪或加速度计
    if (this.data.runType == 0) {
      this.startHighPrecisionLocationTracking();
    } else {
      this.startHighPrecisionAccelerometer();
    }
    
    // 更新状态
    this.setData({
      motion_status: 1
    });
  },
  stopRun() {
    this.vibrateFunc(2);
    let that = this;
    
    // 停止计时器
    if (this.data.timerRunning) {
      const now = Date.now();
      const additionalElapsed = now - this.data.startTime;
      
      this.setData({
        timerRunning: false,
        elapsedTime: this.data.elapsedTime + additionalElapsed
      });
    }
    
    // 取消动画帧
    if (this.animationFrameId) {
      clearTimeout(this.animationFrameId);
    }
    
    // 清除定时器
    if (this.data.time_id) {
      clearInterval(this.data.time_id);
      this.setData({
        time_id: 0
      });
    }
    
    // 清除模拟数据定时器
    if (this.simulatedDataIntervalId) {
      clearInterval(this.simulatedDataIntervalId);
    }
    
    if (this.data.runType == 0) {
      wx.stopLocationUpdate({
        complete: (res) => {},
      });
    }
    
    wx.stopAccelerometer({
      complete: (res) => {
        that.setData({
          motion_status: 2
        });
      },
    });
    
    // 将字符串转换为数字进行比较
    const distance = parseFloat(this.data.distance_data);
    
    // 无论是否有运动数据，都显示三个选项
    wx.showActionSheet({
      itemList: ['保存此数据', '继续运动', '舍弃记录'],
      success(res) {
        console.log('用户选择了选项:', res.tapIndex);
        switch (res.tapIndex) {
          case 0: // 保存此数据
            console.log('保存运动数据，距离:', distance);
            
            // 如果距离为0，提示用户
            if (distance === 0) {
              wx.showModal({
                title: '未检测到任何移动',
                content: '确定要保存空记录吗？',
                success(modalRes) {
                  if (modalRes.confirm) {
                    // 用户确认保存空记录
                    that.saveRunData();
                  } else {
                    // 用户取消，返回继续运动
                    that.reRun();
                  }
                }
              });
            } else {
              // 有运动数据，直接保存
              that.saveRunData();
            }
            break;
            
          case 1: // 继续运动
            that.reRun();
            break;
            
          case 2: // 舍弃记录
            wx.switchTab({
              url: '../index/index',
            });
            break;
            
          default:
            that.reRun();
            break;
        }
      },
      fail(res) {
        console.log('操作取消', res);
        // 如果用户取消操作，默认继续运动
        that.reRun();
      }
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
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.setScreenHeight();
  },
  //设定地图高度为全屏幕高度 
  setScreenHeight() {
    let that = this;
    wx.getSystemInfo({
      success: (res) => {
        that.setData({
          screenHeight: (res.screenHeight * 0.901) + "px"
        })
      },
    })
  },
  //检测是否开启后台定位,并引导用户开启
  checkLocation() {
    if (this.data.runType == 1) return;
    wx.getSetting({
      success(res) {
        let ulb = res.authSetting["scope.userLocationBackground"];

        //console.log(res.authSetting)
        if (ulb == false || ulb == undefined || res.authSetting["scope.userLocation"] == false) {
          wx.showModal({
            title: "提示",
            content: "请先设置位置信息为\"使用小程序期间和离开小程序后\",才可运行跑步模块",
            success(res) {
              if (res.confirm) {
                wx.openSetting({})
              } else {
                wx.switchTab({
                  url: '../index/index',
                })
              }
            }
          })
        }
      }
    })
  },
  checkDistance(lat2, lng2, cur_time) {
    let obj = this.data.polyline[0].points[this.data.polyline[0].points.length - 1];
    // console.log(this.data.polyline[0].points);
    let lat1 = obj.latitude;
    let lng1 = obj.longitude;
    // 调用 return的距离单位为m
    let radLat1 = lat1 * Math.PI / 180.0;
    let radLat2 = lat2 * Math.PI / 180.0;
    let a = radLat1 - radLat2;
    let b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * 6378.137; // EARTH_RADIUS;
    s = Math.round(s * 10000) / 10; //m

    let time_differece = cur_time - this.data.points_time; //秒
    this.data.points_time = cur_time;
    if (time_differece <= 0) {
      return false;
    }

    let cal_distance = (lebu.getStride() / 100) * time_differece; //cm => m
    if ((s <= cal_distance && s > 0) || (s <= this.data.distance_data && this.data.distance > 0) || (s < 35 && s > 0)) {
      return true;
    } else {
      return false;
    }

  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.checkLocation();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    wx.setNavigationBarTitle({
      title: '跑步记录',
    })
    wx.stopLocationUpdate({
      complete: (res) => {},
    })
  },
  onUnload() {
    let that = this;
    
    // 停止计时器
    if (this.data.timerRunning) {
      this.setData({
        timerRunning: false
      });
    }
    
    // 取消动画帧
    if (this.animationFrameId) {
      clearTimeout(this.animationFrameId);
    }
    
    // 清除定时器
    if (this.data.time_id) {
      clearInterval(this.data.time_id);
    }
    
    // 定位停止
    if (this.data.runType == 0) {
      wx.stopLocationUpdate({
        complete: (res) => {},
      });
    }
    
    // 加速度传感器停止监测
    wx.stopAccelerometer({
      complete: (res) => {
        that.setData({
          motion_status: 2
        });
      },
    });
    
    // 跑步模块重置
    lebu.reset();
  },
  // 检查加速度计权限
  checkAccelerometerPermission: function() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userInfo']) {
          console.log('用户已授权个人信息');
        }
        
        // 加速度计通常不需要特殊权限，但我们可以测试它是否可用
        try {
          wx.startAccelerometer({
            interval: 'normal',
            success: () => {
              console.log('加速度计测试成功');
              wx.stopAccelerometer();
            },
            fail: (err) => {
              console.error('加速度计测试失败:', err);
              this.setData({
                accelerometerAvailable: false
              });
            }
          });
        } catch (e) {
          console.error('加速度计测试异常:', e);
          this.setData({
            accelerometerAvailable: false
          });
        }
      }
    });
  },
  // 修改保存运动数据的函数，确保所有数据格式正确
  saveRunData: function() {
    // 确保所有数据格式正确
    let speed_data = this.data.speed_data;
    let distance_data = this.data.distance_data;
    let kcal_data = this.data.kcal_data;
    let time_data = this.data.time_data;
    
    // 检查并修复配速
    if (!speed_data || speed_data.includes("Infinity") || speed_data.includes("NaN") || speed_data === "NaN:NaN") {
      speed_data = "0:00";
    }
    
    // 检查并修复距离
    if (!distance_data || isNaN(parseFloat(distance_data))) {
      distance_data = "0.00";
    }
    
    // 检查并修复卡路里
    if (!kcal_data || isNaN(parseFloat(kcal_data))) {
      kcal_data = "0.00";
    }
    
    // 检查并修复时间
    if (!time_data || time_data.includes("NaN")) {
      time_data = "00:00:00";
    }
    
    // 检查并修复每公里配速数据
    let km_speed_data = this.data.km_speed_data || [];
    km_speed_data = km_speed_data.map(s => {
      if (!s || s.includes("Infinity") || s.includes("NaN") || s === "NaN:NaN") {
        return "0:00";
      }
      return s;
    });
    
    // 确保轨迹点数据存在
    let points_data = [];
    if (this.data.polyline && this.data.polyline[0] && this.data.polyline[0].points) {
      points_data = this.data.polyline[0].points;
    }
    
    console.log('保存数据 - 配速:', speed_data, '距离:', distance_data, '卡路里:', kcal_data);
    
    lebu.reset();
    clearInterval(this.data.time_id);
    let id = parseInt(Date.now() / 1000)
    wx.setStorageSync('RunInfo-' + id, JSON.stringify({
      time_data: time_data,
      speed_data: speed_data,
      kcal_data: kcal_data,
      distance_data: distance_data,
      km_speed_data: km_speed_data,
      points_data: points_data,
      altitude_data: this.data.altitude_data || [],
      altitude: this.data.altitude || 0,
      runType: this.data.runType
    }));
    wx.redirectTo({
      url: './statement?id=' + id,
    });
  },
})