import Card from '../../palette/card';
const app = getApp()
const picDefaultWidth = 50;
const picDefaultHeight = 30;
const picTestFileDefaultWidth = 70;
var host = "https://www.daliandaxue.cn";
// var host = "http://192.168.0.24:8090";
Page({
    onShareAppMessage(res) {
        return {
            title: '和我最为相似的古人竟然是他！',
            path: '/pages/index/index',
            imageUrl: '../../asset/img/share.jpg'
        }
    },
    data: {
        picSelfAdaptWidth: picDefaultWidth,
        picSelfAdaptHeight: picDefaultHeight,
        testPicFile: '',
        testPicResult: null,
        userInfo: null,
        testOfficalRes: null,
        pictureUrl:'',
         width: 0,
        height: 0,
        src: '../../asset/img/bg.jpg' ,
        showAd:true,
        msgList: [
           "hahhaha" ,
           "xixixixi" ,
        ]
    },
    onLoad: function onLoad(options) {
      var _this = this;
      wx.getSystemInfo({
        success: function success(res) {
          _this.setData({
            width: res.windowWidth,
            height: res.windowHeight
          });
        }
      });
      console.log(_this.msgList);
    },
    handleGetUserInfo(e) {
        this.setData({
            userInfo: e.detail.userInfo
        });
        this.handleComputePic();
    },
    handleCancelPic() {
        this.setData({
            testPicFile: '',
            testPicResult: null,
            testOfficalRes: null,
            picSelfAdaptHeight: picDefaultHeight,
            picSelfAdaptWidth: picDefaultWidth
        });
    },
    handleUploadPic() {
        let self = this;
        let ret = wx.chooseImage({
            count: 1,
            sizeType: "compressed",
            success: function(res) {
                self.setData({
                    testPicFile: res.tempFiles[0].path
                });
                self.getImageInfo(res.tempFiles[0].path, function(res) {
                    self.setPicAdaptHeight(res.width, res.height);
                });
            }
        });
    },
    handlePlayAgain() {
        this.setData({
            testPicFile: '',
            testPicResult: null,
            testOfficalRes: null,
            picSelfAdaptHeight: picDefaultHeight,
            picSelfAdaptWidth: picDefaultWidth
        });
    },
   
    handleComputePic() {
        let self = this;
        wx.showLoading({
            title: "AI数据分析中",
            mask: true
        });
        wx.uploadFile({
            url: 'https://api-cn.faceplusplus.com/facepp/v3/detect', //仅为示例，非真实的接口地址
            filePath: self.data.testPicFile,
            name: 'image_file',
            formData: {
                'api_key': 'DVc8JblEbcBjgq55TtDW0sheUhBeCaGe',
                'api_secret': 'lMUVhSAg_ruN4PmwgNCk0IiWPNAF2_Sr',
                'return_attributes': 'gender,age,beauty'
            },
            success: function (res) {
                if (res.statusCode != 200) {
                    wx.showToast({
                        title: '服务器被挤爆了，请稍后再试',
                        icon: 'none',
                        duration: 2000
                    });
                    return false;
                }
                let data = JSON.parse(res.data);
                console.log(data)
                console.log(res)
                if (!data.faces || data.faces.length == 0) {
                    wx.showToast({
                        title: '没有识别到人脸，请更换照片重试',
                        icon: 'none',
                        duration: 2000
                    });
                    return false;
                }
                let human = [];
                data.faces.forEach(item => {
                    let beauty = 50;
                    if (item.attributes.gender.value == 'Male') {
                        beauty = item.attributes.beauty.female_score;
                    } else {
                        beauty = item.attributes.beauty.male_score;
                    }
                    human.push(beauty);
                });
                let beautyIndex = human.indexOf(Math.max.apply(null, human));
                let maxBeautyHuman = data.faces[beautyIndex];
                
                let humanAttr = {
                    age: maxBeautyHuman.attributes.age.value,
                    gender: maxBeautyHuman.attributes.gender.value,
                    beauty: 50
                };
                if (humanAttr.gender == 'Male') {
                    humanAttr.beauty = maxBeautyHuman.attributes.beauty.female_score;
                } else {
                    humanAttr.beauty = maxBeautyHuman.attributes.beauty.male_score;
                }

                humanAttr.gender = humanAttr.gender == 'Male' ? "male" : "female";
                humanAttr.beauty = Math.ceil(humanAttr.beauty) + 15;
                humanAttr.beauty = humanAttr.beauty > 97 ? 97 : humanAttr.beauty;
                humanAttr.defeat = self.computeBeautyDefeatRatio(humanAttr.beauty);
                console.log("=====");
                console.log(humanAttr);
                self.setData({
                    testPicResult: humanAttr,
                    showAd:false
                });
           
             
                wx.hideLoading();
            },
            fail: function() {
                wx.showToast({
                    title: '网络异常，请稍后再试',
                    icon: 'none',
                    duration: 2000
                });
            }
        }),
        wx.request({
          url: host +'/handface/WeChat/getOfficalData',
          success: function(res){
            self.setData({
              testOfficalRes: res.data.data
            })
            
          }
        })
    },
    getImageInfo(imgSrc, scb, ecb) {
        wx.getImageInfo({
            src: imgSrc,
            success: scb,
            fail: ecb
        });
    },
    setPicAdaptHeight(picWidth, picHeight) {
        let h = (app.globalData.screenWidth * 0.7 / picWidth) * picHeight / app.globalData.screenHeight * 100;
        this.setData({
            picSelfAdaptHeight: h,
            picSelfAdaptWidth: picTestFileDefaultWidth
        });
    },
    computeBeautyDefeatRatio(beauty) {
        return Math.ceil(Math.sqrt(beauty) * 10);
    },
    savePicture: function () {
      
      var that = this
      console.log(that.data.testPicResult)
      wx.showLoading({
        title: "图片生成中",
        mask: true
      });
      // { age: 21, gender: "male", beauty: 96, defeat: 98 }
      wx.request({
        url: host + '/handface/WeChat/getShareImage',
        method: 'POST',
        data: {
          age: that.data.testPicResult.age,
          gender: that.data.testPicResult.gender,
          beauty: that.data.testPicResult.beauty,
          defeat: that.data.testPicResult.defeat
        },

        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
       
          console.log("======")
          console.log()
          that.setData({
            pictureUrl: res.data.data.imageUrl
          })


          wx.downloadFile({
            url: that.data.pictureUrl,
            success: function (myres) {
              console.log("====success==");
              console.log(myres);
              wx.saveImageToPhotosAlbum({
                filePath: myres.tempFilePath,
                success(res) {
                  wx.showModal({
                    content: '图片已保存到相册，赶紧晒一下吧~',
                    showCancel: false,
                    confirmText: '好哒',
                    confirmColor: '#72B9C3',
                    success: function (res) {
                      if (res.confirm) {
                        console.log('用户点击确定');
                        that.setData({
                          hidden: true
                        })
                      }
                    }
                  })
                }
              })
            }
          })
          console.log(res)
          setTimeout(function () {

            wx.hideLoading()
          }, 6000)
          
        },
        fail: function (res) {
          console.log(res)
          wx.hideLoading();
        },
    
      })
       

    }
})