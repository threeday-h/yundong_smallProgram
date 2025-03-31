// pages/login/setting.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    steps: "1",
    sex: true,
    weight_index: 30,
    weight_picker: [],
    height_index: 40,
    height_picker: [],
    distance_picker: [],
    distance_index: 0,
    kcal_picker: [],
    kcal_index: 0,
    heightPickerVisible: false,
    weightPickerVisible: false,
    distancePickerVisible: false,
    kcalPickerVisible: false,
    heightOptions: [],
    weightOptions: [],
    distanceOptions: [],
    kcalOptions: [],
    heightValue: [],
    weightValue: [],
    distanceValue: [],
    kcalValue: []
  },
  weightSetting(e) {
    if (this.data.vibrate) {
      wx.vibrateShort({})
    }
    
    const selectedValue = e.detail.value[0];
    const selectedIndex = this.data.weight_picker.findIndex(item => item === selectedValue);
    
    this.setData({
      weight_index: selectedIndex,
      weightValue: [selectedValue],
      weightPickerVisible: false
    });
  },
  heightSetting(e) {
    if (this.data.vibrate) {
      wx.vibrateShort({})
    }
    
    const selectedValue = e.detail.value[0];
    const selectedIndex = this.data.height_picker.findIndex(item => item === selectedValue);
    
    this.setData({
      height_index: selectedIndex,
      heightValue: [selectedValue],
      heightPickerVisible: false
    });
  },
  distanceSetting(e) {
    if (this.data.vibrate) {
      wx.vibrateShort({})
    }
    
    const selectedValue = e.detail.value[0];
    const selectedIndex = this.data.distance_picker.findIndex(item => item === selectedValue);
    
    this.setData({
      distance_index: selectedIndex,
      distanceValue: [selectedValue],
      distancePickerVisible: false
    });
  },
  kcalSetting(e) {
    if (this.data.vibrate) {
      wx.vibrateShort({})
    }
    
    const selectedValue = e.detail.value[0];
    const selectedIndex = this.data.kcal_picker.findIndex(item => item === selectedValue);
    
    this.setData({
      kcal_index: selectedIndex,
      kcalValue: [selectedValue],
      kcalPickerVisible: false
    });
  },
  settingMenu() {
    this.vibrateFunc(1);
    wx.openSetting({})
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let weight = [],
      height = [],
      distance = [],
      kcal = [];
    
    // 生成数据数组
    for (let i = 20; i <= 200; i++) {
      weight.push(i);
    }
    for (let i = 130; i <= 220; i++) {
      height.push(i);
    }
    for (let i = 1; i <= 500; i++) {
      distance.push(i);
    }
    for (let i = 1, j = 100; i <= 50; i++) {
      kcal.push(j);
      j += 100;
    }

    // 设置基础数据
    this.setData({
      weight_picker: weight,
      height_picker: height,
      distance_picker: distance,
      kcal_picker: kcal,
    });
    
    // 为 TDesign Picker 准备格式化的选项
    const heightOptions = height.map(item => ({ label: item + ' Cm', value: item }));
    const weightOptions = weight.map(item => ({ label: item + ' Kg', value: item }));
    const distanceOptions = distance.map(item => ({ label: item + ' Km', value: item }));
    const kcalOptions = kcal.map(item => ({ label: item + ' Kcal', value: item }));
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '设定计划[1/3]',
    });
    
    // 设置选项数据和默认选中值
    this.setData({
      heightOptions,
      weightOptions,
      distanceOptions,
      kcalOptions,
      // 设置默认选中的值（而不是索引）
      heightValue: [heightOptions[40].value], // 170cm
      weightValue: [weightOptions[30].value], // 50kg
      distanceValue: [distanceOptions[0].value], // 1km
      kcalValue: [kcalOptions[0].value]  // 100kcal
    });
  },
  changeSex(e) {
    this.vibrateFunc(1);
    this.setData({
      sex: (e.currentTarget.dataset.sex == "true") ? true : false,
    });
  },
  next(e) {
    this.vibrateFunc(1);
    if (e.currentTarget.dataset.steps == 4) {
      wx.setStorageSync('weight', this.data.weight_picker[this.data.weight_index]);
      wx.setStorageSync('height', this.data.height_picker[this.data.height_index]);
      wx.setStorageSync('distance', this.data.distance_picker[this.data.distance_index]);
      wx.setStorageSync('kcal', this.data.kcal_picker[this.data.kcal_index]);
      wx.setStorageSync('sex', this.data.sex)
      wx.switchTab({
        url: '../index/index',
      })
    }
    this.setData({
      steps: e.currentTarget.dataset.steps
    });
    if (this.data.steps == "1") {
      wx.setNavigationBarTitle({
        title: '设定计划[1/3]',
      })
    } else if (this.data.steps == "2") {
      wx.setNavigationBarTitle({
        title: '设定计划[2/3]',
      })
    } else if (this.data.steps == "3") {
      wx.setNavigationBarTitle({
        title: '设定计划[3/3]',
      })
    }
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
  showHeightPicker() {
    this.setData({ heightPickerVisible: true });
  },
  closeHeightPicker() {
    this.setData({ heightPickerVisible: false });
  },
  showWeightPicker() {
    this.setData({ weightPickerVisible: true });
  },
  closeWeightPicker() {
    this.setData({ weightPickerVisible: false });
  },
  showDistancePicker() {
    this.setData({ distancePickerVisible: true });
  },
  closeDistancePicker() {
    this.setData({ distancePickerVisible: false });
  },
  showKcalPicker() {
    this.setData({ kcalPickerVisible: true });
  },
  closeKcalPicker() {
    this.setData({ kcalPickerVisible: false });
  },
  onPickHeight(e) {
    console.log('正在选择身高:', e.detail.value);
  },
  onPickWeight(e) {
    console.log('正在选择体重:', e.detail.value);
  },
  onPickDistance(e) {
    console.log('正在选择路程:', e.detail.value);
  },
  onPickKcal(e) {
    console.log('正在选择卡路里:', e.detail.value);
  }
})