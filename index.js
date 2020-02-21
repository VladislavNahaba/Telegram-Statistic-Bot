require('dotenv').config();
const Telegraf = require('telegraf');
const fs = require('fs');
const md5 = require('md5');
const { CanvasRenderService } = require('chartjs-node-canvas');
const https = require('https');
const axios = require('axios');
const Paper = require('./library/Paper');
const ImageObject = require('./library/objects/ImageObject');
const TextObject = require('./library/objects/TextObject');
const LineObject = require('./library/objects/LineObject');
const RectangleObject = require('./library/objects/RectangleObject');
const format = '.png';
Paper.fontRegister('./fonts/Roboto.ttf', {
  family: 'Roboto'
});
Paper.fontRegister('./fonts/Robotoitalic.ttf', {
  family: 'Robotoitalic'
});
Paper.fontRegister('./fonts/Robotoblack.ttf', {
  family: 'Robotoblack'
});
const graphNamesArray = [
  {
    name: 'periodicityStat',
    type: 'bar',
    desc: 'Перидоичность выхода публикаций за последние 30 дней',
    note: null
  },
  {
    name: 'viewsStat',
    type: 'bar',
    desc: 'Просмотры публикаций за последние 30 дней',
    note: 'Красным выделены подозрительные публикации. ' +
      'Подозрительные публикации и форварды исключаются из расчета средних просмотров, ER и прогнозов.'
  },
  {
    name: 'dayViewsStat',
    type: 'bar',
    desc: 'Средние просмотры за последние 30 дней',
    note: 'Серым выделены дни, в которые не выходило новых публикаций. ER за эти дня прогнозируется.'
  },
  {
    name: 'erStat',
    type: 'line',
    desc: 'Изменение ER за последние 30 дней',
    note: null
  }
];
const width = 1200;
const height = 300;
const marginLeftRight = 20;
const headerSize = 240;
const footerSize = 20;
const descSize = 60;
const mainColor = '#ffffff';
const secondColor = '#e0e0e0';

const bot = new Telegraf('BOT_TOKEN');
bot.start((ctx) => {
  ctx.reply('Данный бот позволяет получить подробную информацию о канале - периодичность выхода публикаций, просмотры постов, изменение ER, а также такие параметры канала как CPM, CPS и прогнозируемый прирост подписчиков.\n С ним вы легко сможете оценить канал и понять стоит ли покупать на нём рекламу и какова реальная её стоимость. Чтобы узнать как пользоваться ботом введите /help.')
});
bot.help((ctx) => ctx.reply('Для получения информации о канале введите имя_канала или join-ссылку на канал.\n' +
  'Вы можете указать доп. данные для получения более подробной информации.\n' +
  'Указывать в такой последовательности: цена, срок, прирост.\n' +
  'Пример: @bestsalesru, 2500, 3, 7'));


bot.on('message', (ctx) => {
    if (ctx.message.hasOwnProperty('text')) {
        ctx.reply(`${ctx.message.text}: обрабатываем ваш запрос!`, {
          disable_web_page_preview: true
        });
        let {channelName, money, term, percent} = getParams(ctx.message.text);
        let channelNameHashed = md5(channelName);
        getChannelData(channelName).then(channelData => {
          let er = getEr(channelData['erStat']['datasets'][0]['data'], term);
          let views = getViews(channelData['dayViewsStat']['datasets'][0]['data'], term);
          let cpm = getCpm(views, money);
          let cps = getCps(views, money, term, percent);
          let prediction = getSub(views, term, percent);
          ctx.reply('Имя канала: ' + channelData.title + '\n' +
            'Подписчиков: ' + channelData.totalMembers + '\n' +
            'Ссылка: ' + channelData.link + '\n' +
            'Тип: ' + (channelData.type === 'public' ? 'публинчый' : 'приватный') + '\n' +
            'ER: ' + er + '\n' +
            'Просмотры: ' + views + '\n' +
            'Инфографика: \n',
            {reply_to_message_id: ctx.message.message_id, disable_web_page_preview: true});
            const promisesArray = [];
            graphNamesArray.forEach(el => {
              if (channelData.hasOwnProperty(el.name)) {
                let imageNameHashed = md5(el.name) + format;
                promisesArray.push(getGraphs(width - marginLeftRight * 2, height, getConfig({
                  labels: channelData[el.name].labels,
                  datasets: channelData[el.name].datasets,
                }, el.type, el.desc)).then(bufferImage => {
                  return moveTo(process.env.ASSETS + '/' + channelNameHashed).then(dirPath => {
                    return writeFile( dirPath + '/' + imageNameHashed, bufferImage).then(filePath => {
                      return {
                        filePath: filePath,
                        mainDir: dirPath,
                        desc: el.desc,
                        note: el.note
                      };
                    }).catch(e => {
                      errorLog(e);
                      ctx.reply('Не удалось сохранить изображение: ' + e.message)
                    })
                  })
                }));
                if (promisesArray.length === graphNamesArray.length) {
                  Promise.all(promisesArray).then(imagesData => {
                    let amountOfDesc = graphNamesArray.reduce((accumulator, currentValue) => {
                      if (currentValue.note !== null) {
                        return accumulator += 1;
                      } else {
                        return accumulator;
                      }
                    }, 0);
                    let paper = new Paper(width, height * 4 + headerSize + descSize * amountOfDesc + footerSize);
                    paper.fill(mainColor);
                    let objectsArr = [
                      {
                        object: new RectangleObject(mainColor, true, secondColor),
                        params: {
                          x: marginLeftRight,
                          y: 5,
                          width: width - 40,
                          height: 110
                        }
                      },
                      {
                        object: new RectangleObject(mainColor, true, secondColor),
                        params: {
                          x: marginLeftRight,
                          y: 125,
                          width: width - 40,
                          height: 110
                        }
                      },
                      {
                        object: new TextObject(channelData.title, {
                          font: '24px Robotoblack',
                          fillStyle: '#2b2b2b',
                          textBaseline: 'middle'
                        }, true),
                        params: {
                          x: 0,
                          y: 22
                        }
                      },
                      {
                        object: new TextObject('Подписчиков: ' + channelData.totalMembers, {
                          font: '14px Roboto',
                          fillStyle: '#2b2b2b',
                          textBaseline: 'middle'
                        }, true),
                        params: {
                          x: 0,
                          y: 50
                        }
                      },
                      {
                        object: new TextObject('Ссылка: ' + channelData.link, {
                          font: '14px Roboto',
                          fillStyle: '#2b2b2b',
                          textBaseline: 'middle'
                        }, true),
                        params: {
                          x: 0,
                          y: 71
                        }
                      },
                      {
                        object: new TextObject('Тип: ' + (channelData.type === 'public' ? 'публинчый' : 'приватный'), {
                          font: '14px Roboto',
                          fillStyle: '#2b2b2b',
                          textBaseline: 'middle'
                        }, true),
                        params: {
                          x: 0,
                          y: 92
                        }
                      },
                      {
                        object: new TextObject('Прогнозные показатели', {
                          font: '20px Roboto',
                          fillStyle: '#2b2b2b',
                          textBaseline: 'middle'
                        }, true),
                        params: {
                          x: 0,
                          y: 142
                        }
                      },
                      {
                        object: new TextObject('ER', {
                          font: '20px Roboto',
                          fillStyle: '#2b2b2b',
                          textBaseline: 'middle',
                          textAlign: 'center'
                        }),
                        params: {
                          x: width / 10,
                          y: 170
                        }
                      },
                      {
                        object: new TextObject(er, {
                          font: '18px Roboto',
                          fillStyle: '#1abc9c',
                          textBaseline: 'middle',
                          textAlign: 'center'
                        }),
                        params: {
                          x: width / 10,
                          y: 206
                        }
                      },
                      {
                        object: new TextObject('Просмотры', {
                          font: '20px Roboto',
                          fillStyle: '#2b2b2b',
                          textBaseline: 'middle',
                          textAlign: 'center'
                        }),
                        params: {
                          x: width / 10 + width / 5,
                          y: 170
                        }
                      },
                      {
                        object: new TextObject(views, {
                          font: '18px Roboto',
                          fillStyle: '#2ecc71',
                          textBaseline: 'middle',
                          textAlign: 'center'
                        }),
                        params: {
                          x: width / 10 + width / 5,
                          y: 206
                        }
                      },
                      {
                        object: new TextObject('CPM', {
                          font: '20px Roboto',
                          fillStyle: '#2b2b2b',
                          textBaseline: 'middle',
                          textAlign: 'center'
                        }),
                        params: {
                          x: width / 10 + width / 5 * 2,
                          y: 170
                        }
                      },
                      {
                        object: new TextObject(cpm, {
                          font: '18px Roboto',
                          fillStyle: '#3498db',
                          textBaseline: 'middle',
                          textAlign: 'center'
                        }),
                        params: {
                          x: width / 10 + width / 5 * 2,
                          y: 206
                        }
                      },
                      {
                        object: new TextObject('CPS', {
                          font: '20px Roboto',
                          fillStyle: '#2b2b2b',
                          textBaseline: 'middle',
                          textAlign: 'center'
                        }),
                        params: {
                          x: width / 10 + width / 5 * 3,
                          y: 170
                        }
                      },
                      {
                        object: new TextObject(cps, {
                          font: '18px Roboto',
                          fillStyle: '#9b59b6',
                          textBaseline: 'middle',
                          textAlign: 'center'
                        }),
                        params: {
                          x: width / 10 + width / 5 * 3,
                          y: 206
                        }
                      },
                      {
                        object: new TextObject('Прогноз прироста', {
                          font: '20px Roboto',
                          fillStyle: '#2b2b2b',
                          textBaseline: 'middle',
                          textAlign: 'center'
                        }),
                        params: {
                          x: width / 10 + width / 5 * 4,
                          y: 170
                        }
                      },
                      {
                        object: new TextObject(prediction, {
                          font: '18px Roboto',
                          fillStyle: '#34495e',
                          textBaseline: 'middle',
                          textAlign: 'center'
                        }),
                        params: {
                          x: width / 10 + width / 5 * 4,
                          y: 206
                        }
                      },
                    ];
                    let descIterator = 0;
                    imagesData.forEach((el, index) => {
                      objectsArr.push(
                        {
                          object: new ImageObject(el.filePath),
                          params: {
                            x: marginLeftRight,
                            y: height * index + headerSize + descSize * descIterator
                          }
                        });
                      if (el.note !== null) {
                        objectsArr.push(
                          {
                            object: new ImageObject('./assets/icons/question_2.png'),
                            params: {
                              x: marginLeftRight,
                              y: height * (index + 1) + headerSize + descSize * (descIterator + 1) - 32
                            }
                          },
                          {
                            object: new LineObject(secondColor, 2),
                            params: {
                              start: {
                                x: marginLeftRight,
                                y: height * (index + 1) + headerSize + descSize * (descIterator + 1),
                              }, end: {
                                x: marginLeftRight + width,
                                y: height * (index + 1) + headerSize + descSize * (descIterator + 1)
                              }
                            }
                          },
                          {
                            object: new TextObject(el.note, {
                              font: '15px Robotoitalic',
                              fillStyle: '#2b2b2b',
                              textBaseline: 'alphabetic',
                              textAlign: 'left'
                            }, false, false, width),
                            params: {
                              x: marginLeftRight + 28,
                              y: height * (index + 1) + headerSize + descSize * (descIterator + 1) - 11
                            }
                          }
                        );
                      }
                      if(el.note !== null) {
                        descIterator++;
                      }
                    });
                    Promise.all(objectsArr.map((obj) => obj.object.load())).then(() => {
                      objectsArr.forEach((object) => {
                        object.object.draw(paper, object.params)
                      });
                      paper.save(imagesData[0].mainDir + '/' + md5('grapg') + format).then((infoImg) => {
                        ctx.replyWithDocument({
                          source: infoImg
                        });
                      })
                    }).catch(e =>{
                      errorLog(e);
                      ctx.reply(e);
                    })
                  })
                }
              }
            });
          }
        ).catch(e => {
          errorLog(e);
          ctx.reply('Ошибка запроса канала: ' + e.message)
        });
    }
  });


function errorLog(err) {
  fs.appendFileSync('logs.txt', err);
}

function getEr(array, term) {
  if (!term) {
    return array[2];
  }
  if (term > array.length) {
    return array[2];
  }
  return array[term];
}

function getViews(array, term) {
  if (!term) {
    return array[2];
  }
  if (term > array.length) {
    return array[2];
  }
  return array[term];
}

function getCpm(views, money) {
  if (!money) {
    return '?';
  }
  if (views > 0) {
    return parseInt((money * 1000) / views)
  }
  return 0;
}

function getCps(views, money, term, percent) {
  if (!money || !term || !percent) {
    return '?';
  }
  if (views > 0) {
    return Math.ceil(money / (views * percent / 100));
  }
  return 0;
}

function getSub(views, term, percent) {
  if (!term || !percent) {
    return '?';
  }
  if (views > 0) {
    return Math.ceil(views * percent / 100);
  }
  return 0;
}

function getParams(str) {
  let strSplitted = str.trim().split(',');
  let name = null;
  if (strSplitted.length > 0) {
    name = strSplitted[0].trim();
  }
  let money = null;
  if (strSplitted.length > 1) {
    money = Number(strSplitted[1].trim());
  }
  let term = null;
  if (strSplitted.length > 2) {
    term = Number(strSplitted[2].trim());
  }
  let percent = null;
  if (strSplitted.length > 3) {
    percent = Number(strSplitted[3].trim());
  }
  return {
    channelName: name,
    money: money,
    term: term,
    percent: percent
  }
}

async function getChannelData (channelName) {
  return await axios.get(`API_SERVER_WITH_CALCULATIONS=${channelName}`, {
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  })
    .then(response => {
      if (response.data.error) {
        throw new Error(response.data.errorMessage)
      }
      return response.data.data;
    })
}

async function getGraphs(width, height, configuration) {
  const canvasRenderService = new CanvasRenderService(width, height, () => {});
  return await canvasRenderService.renderToBuffer(configuration);
}

function getConfig (data, type, desc) {
  let config = {
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      display: true,
      labels: {
        fontFamily: "Roboto",
        fontSize: 16,
        usePointStyle: true
      }
    },
    title: {
      display: true,
      text: desc,
      fontFamily: "Roboto",
      padding: 15,
      fontSize: 18
    },
    tooltips: {
      mode: 'index',
      intersect: false
    },
    scales: {
      yAxes: [{
        stacked: true,
        ticks: {
          beginAtZero: true,
          min: 0
        }
      }],
      xAxes: [{
        stacked: true
      }]
    }
  };
  return {
    type: type,
    data: {
      labels: data.labels,
      datasets: data.datasets
    },
    options: config
  };
}


function moveTo (path) {
  return new Promise(r=>fs.access(path, fs.F_OK, e => r(!e))).then( bool => {
    if (!bool) {
      return new Promise((resolve, reject) => {
        fs.mkdir( path, {recursive: true}, (err) => {
          if (err) reject(err);
          resolve(path);
        });
      }).then(createdPath => {
        return createdPath;
      })
    } else {
      return path;
    }
  })
}

function writeFile (path, image) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, image, (err) => {
      if (err) reject(err);
      return resolve(path);
    })
  });
}

bot.launch();
