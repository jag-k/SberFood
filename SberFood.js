String.prototype.insert = function (index, string) {
  if (index > 0) {
    return this.substring(0, index) + string + this.substr(index);
  }
  return string + this;
};


function labelStyle(element) {
  element.textColor = Color.black()
  element.textOpacity = 0.7
  element.font = Font.mediumSystemFont(13)
  return element
}

function valueStyle(element) {
  element.textColor = Color.white()
  element.font = Font.boldSystemFont(18)
  return element
}

function addLabel(element, text, center = false, vertical = false) {
  return labelStyle(center ? centerText(element, text, vertical) : element.addText(text))
}

function addValue(element, text, center = false, vertical = false) {
  return valueStyle(center ? centerText(element, text, vertical) : element.addText(text))
}

function setPadding(element, ...paddings) {
  let [top, leading, bottom, trailing] = paddings
  if (paddings.length === 1) {
    element.setPadding(top, top, top, top)
  } else if (paddings.length === 2) {
    element.setPadding(top, leading, top, leading)
  } else if (paddings.length === 3) {
    element.setPadding(top, leading, bottom, leading)
  } else if (paddings.length === 4) {
    element.setPadding(top, leading, bottom, trailing)
  }
  return element
}

function centerText(element, text, vertical = false) {
  const stack = element.addStack()
  stack.addSpacer()
  const textElement = stack.addText(text)
  stack.addSpacer()
  if (vertical) stack.layoutVertically()
  return textElement
}

function centerStack(element, vertical = false) {
  const stack = element.addStack()
  if (vertical) stack.layoutVertically()
  stack.addSpacer()
  const output = stack.addStack()
  stack.addSpacer()
  return output
}


const TOKEN = "SBERFOOD_WIDGET_TOKEN"
const USER_ID = "SBERFOOD_WIDGET_USER_ID"
const BackgroundColor = new Color('ffcc00', 1)
const singleOrganization = args.widgetParameter !== null;

const SMALL = config.widgetFamily === "small"
const MEDIUM = config.widgetFamily === "medium"
const LARGE = config.widgetFamily === "large"

let loggedIn = true

await login()

const widget = await (loggedIn ? Widgets() : loginWidget())

if (config.runsInWidget) {
  Script.setWidget(widget)
} else if (loggedIn) {
  await startMenu()
}

Script.complete()

async function errorAlert(message) {
  const alert = new Alert()
  alert.text = "Произошла ошибка!"
  alert.message = message ? message : "Попробуйте позже"
  alert.addCancelAction("Закрыть")
  await alert.present()
  loggedIn = false
}

async function getSMS(tel) {
  let req = new Request("https://app.sberfood.ru/api/mobile/v3/auth/sendSms");
  req.method = "POST";
  req.headers = {
    Accept: "application/json",
    AppKey: "WebApp-3a2605b0cf2a4c9d938752a84b7e97b6",
    AppPlatform: "Web",
    AppVersion: "1",
    "Content-Type": "application/json;charset=UTF-8"
  }
  req.body = JSON.stringify({
    userPhone: tel
  })
  let res = await req.loadString()
  if (res && req.statusCode === 500) {
    await errorAlert(JSON.stringify(res)["message"])
    return
  }
  console.log(res)
  console.log(req.response)
  return req
}

async function checkSMS(tel, code) {
  let req = new Request("https://app.sberfood.ru/api/mobile/v3/auth/checkSms");
  req.method = "POST"
  req.headers = {
    "Content-Type": "application/json;charset=UTF-8",
    AppKey: "WebApp-3a2605b0cf2a4c9d938752a84b7e97b6",
    AppPlatform: "Web",
    AppVersion: "1",
  };
  req.body = JSON.stringify({
    userPhone: tel,
    password: code
  })
  let res = await req.loadJSON()
  if (res && req.statusCode === 500) {
    return await errorAlert(JSON.stringify(res)["message"])
  }
  console.log(res)
  console.log(req.response)
  return res
}

async function login() {
  if (!Keychain.contains(TOKEN)) {
    let telNumber = new Alert()
    telNumber.title = "Вход в SberFood"
    telNumber.addAction("Вход")
    telNumber.message = "Введите номер телефона"
    telNumber.addTextField("+79001201234", "+7")

    await telNumber.present()
    let tel = telNumber.textFieldValue(0)
    let sms = await getSMS(tel)
    if (!sms) {
      let codeSMS = new Alert()
      codeSMS.title = "Вход в SberFood"
      codeSMS.addAction("Вход")
      codeSMS.message = "Введите код из SMS"
      codeSMS.addTextField("1234")
      await codeSMS.present()

      let code = codeSMS.textFieldValue(0)
      let data = await checkSMS(tel, code)
      console.log(data)
      if (data) {
        Keychain.set(TOKEN, data['token'])
        Keychain.set(USER_ID, data['userId'])
      } else {
        await errorAlert()
      }
    }
  }
}

async function Widgets() {
  const index = singleOrganization ? args.widgetParameter : 0

  let api = await sberFoodWallet(index)
  let widget = new ListWidget()
  widget.backgroundColor = BackgroundColor
  if (SMALL && !singleOrganization) {
    return await codeWidget(widget);
  }
  let stack = widget.addStack()
  setPadding(stack, 0)
  stack.layoutVertically()
  stack = await createWidget(stack, api)

  if (SMALL) return widget

  try {
    if (singleOrganization) {
      stack = await codeWidget(stack);
      if (MEDIUM) stack.layoutHorizontally()
    } else {
      if (LARGE) {
        addValue(stack, "\n")
        await createWidget(stack, await sberFoodWallet(1))
      }
    }
  } catch (err) {
    console.error(err)
  }
  return widget
}

async function createWidget(rootWidget, api) {
  let appIcon = await loadAppIcon(api.logo)
  let title = api.name
  const widget = rootWidget.addStack()
  if (!SMALL) widget.backgroundColor = new Color("000000", 0.1)

  widget.cornerRadius = 15
  setPadding(widget, 10)

  widget.url = "https://app.sberfood.ru/places/" + api["id"]
  widget.layoutVertically()

  let starSymbol = SFSymbol.named("star.circle")
  starSymbol.applyMediumWeight()
  starSymbol = starSymbol.image

  // Show title and logo
  let titleStack = widget.addStack()

  if (SMALL || (singleOrganization && !LARGE)) {
    let logoElement = titleStack.addImage(appIcon)
    logoElement.cornerRadius = 7
    logoElement.imageSize = new Size(15, 15)
    titleStack.addSpacer(8)
    addLabel(titleStack, title)
    titleStack.setPadding(0, 0, 15, 0)

  } else {
    addLabel(titleStack, title)
    titleStack.addSpacer()

    let logoElement = titleStack.addImage(appIcon)
    logoElement.cornerRadius = 20
    logoElement.imageSize = new Size(40, 40)
  }

  // Show Bonuses
  let bonusesStack = widget.addStack()

  setPadding(bonusesStack, 0, 0, 10)

  addLabel(bonusesStack, "Бонусы:")
  let bonuses = widget.addStack()

  let starElement = bonuses.addImage(starSymbol)
  starElement.imageSize = new Size(21, 21)
  starElement.tintColor = Color.white()

  addValue(bonuses, api.balance.toString())

  // Show Rank and Cashback
  if (LARGE || (!SMALL && !singleOrganization)) {

    let rankCashLabel = widget.addStack()
    rankCashLabel.setPadding(10, 0, 0, 0)

    addLabel(rankCashLabel, "Уровень:")
    rankCashLabel.addSpacer()

    addLabel(rankCashLabel, "Кешбек")

    let rankCashValue = widget.addStack()
    addValue(rankCashValue, api.status)
    rankCashValue.addSpacer()

    addValue(rankCashValue, api.bonus.toString() + "%")
    setPadding(widget, 15)
  }

  return rootWidget
}

async function codeWidget(rootWidget) {
  const large = LARGE

  const fontSize = large ? 50 : 30
  const widget = centerStack(rootWidget, large)

  widget.layoutVertically()
  widget.spacing = 10

  addLabel(widget, 'Код для кассира', true)

  const code = centerText(widget, await getCode())
  code.font = Font.blackSystemFont(fontSize)
  code.textColor = Color.white()
  addLabel(widget, (new Date()).toLocaleString(), true)

  return rootWidget
}

async function loginWidget() {
  let widget = new ListWidget()
  widget.backgroundColor = BackgroundColor

  addValue(widget, "Для начала необходимо авторизоваться")
  return widget
}


async function sberFoodWallet(index) {
  let data = await loadWallet();
  let organization
  if (typeof index === "string") {
    for (let org of data) {
      if (org.nearbyOrganization.id === index) organization = org
    }
  } else {
    organization = data[index]
  }
  let {nearbyOrganization, wallet} = organization;
  return {
    name: organization.network.name,
    balance: wallet.balance / nearbyOrganization.currency.centsCount,
    status: wallet.currentRankName,
    logo: wallet.logoImageUrl,
    bonus: wallet.bonusPercentage,
    id: nearbyOrganization.id,
  }
}

async function loadWallet() {
  let url = "https://app.sberfood.ru/api/mobile/v3/user/" +
    Keychain.get(USER_ID) + "/wallets"
  let d = new Date();
  url += "?offset=0&t=" + d.getTime();

  let req = new Request(url);
  req.method = "GET";
  req.headers = getHeaders();
  return await req.loadJSON()
}

function getHeaders(withContent) {
  let res = {
    Accept: "application/json",
    AppKey: "WebApp-3a2605b0cf2a4c9d938752a84b7e97b6",
    AppPlatform: "Web",
    AppVersion: "1",
    Token: Keychain.get(TOKEN),
  }
  if (withContent) {
    res["Content-Type"] = "application/json;charset=UTF-8"
  }
  return res
}

async function loadAppIcon(url) {
  let req = new Request(url)
  return req.loadImage()
}

async function getCode() {
  let url = "https://app.sberfood.ru/api/mobile/v3/user/" +
    Keychain.get(USER_ID) + "/generateCode"

  let req = new Request(url);
  req.method = "POST";
  req.headers = getHeaders();
  let res = await req.loadJSON()
  return res["code"].toString().slice(1).insert(3, "  ")
}

async function activateCode(code) {
  let url = "https://app.sberfood.ru/api/mobile/v3/order/activate"

  let req = new Request(url);
  req.method = "POST";
  req.headers = getHeaders(true);
  req.body = JSON.stringify(
    {
      promoCode: code,
      clientFeatures: ["Split"],
      userId: Keychain.get(USER_ID)
    }
  )
  return await req.loadJSON()
}


async function inputCode() {
  let a = new Alert();
  a.title = "Код для кассира"
  a.message = `\n\n${await getCode()}\n\n\nИли введите код с чека`
  a.addTextField("0000#0000", "5619#")
  a.addAction("Отправить")
  a.addCancelAction("Закрыть")

  let index = await a.present()
  if (index !== -1) {
    let code = a.textFieldValue(0).replace("#", "").insert(4, "#")
    const oldData = await loadWallet();
    console.log(oldData)

    let data = await activateCode(code)
    if (data.httpStatusCode && data.httpStatusCode === 500) {
      await errorAlert(data["message"])
      return
    }
    let statusNotification = new Notification();
    statusNotification.title = "Кешбек!"
    statusNotification.sound = "default"
    let beforeBonuses = 0;
    let centCount = 0;

    let organization = data["organization"];
    for (let wallet of oldData) {
      if (wallet['network']['id'] === organization['id']) {
        centCount = +wallet["nearbyOrganization"]["currency"]["centsCount"];
        beforeBonuses = wallet['wallet']['balance'] / centCount
      }
    }
    let wallet = organization["wallet"]
    let order = data["order"]
    let sum = +order["orderFullSum"] / centCount
    statusNotification.body = `Покупка в " ${organization["organization"]["name"]}" на ${sum} ${order["currency"]["shortName"]}`
    statusNotification.subtitle = `${beforeBonuses} -> ${wallet["balance"] / centCount}`

    await statusNotification.schedule();
  }
}

async function startMenu() {
  let a = new Alert();
  a.title = "Выберите действие:"
  a.addAction("Получить код")
  a.addAction("Получить код организации для виджета")
  a.addCancelAction("Отмена")
  let res = await a.presentSheet()
  console.log(res);
  if (res === 0) {
    return await inputCode()
  }
  if (res === 1) {
    return await getOrganizationID()
  }
}

async function getOrganizationID() {
  let a = new Alert();
  a.title = "Выберите организацию"
  const data = await loadWallet()
  const clipboard = []
  console.log(data)
  for (let org of data) {
    const nearby = org.nearbyOrganization;
    clipboard.push(nearby.id)
    a.addAction(nearby.name)
  }
  console.log(clipboard)

  Pasteboard.copy(clipboard[await a.presentSheet()])
  a = new Alert();
  a.title = "ID Организации скопирован!"
  await a.present()
}
