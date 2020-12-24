// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: utensils;
String.prototype.insert = function (index, string) {
  if (index > 0) {
    return this.substring(0, index) + string + this.substr(index);
  }

  return string + this;
};


const TOKEN = "SBERFOOD_WIDGET_TOKEN"
const USER_ID = "SBERFOOD_WIDGET_USER_ID"
let logined = true

await login()

const widget = await (logined ? Widgets() : loginWidget())

if (config.runsInWidget) {
  Script.setWidget(widget)
} else if (logined) {
  await inputCode()
}

if (args.widgetParameter !== null) {
  let a = new Notification()
  a.title = args.widgetParameter
  await a.schedule()
}

Script.complete()

function errorAlert(message) {
  const alert = new Alert()
  alert.text = "Произошла ошибка!"
  alert.message = message ? message : "Попробуйте позже"
  alert.addCancelAction("Закрыть")
  alert.present()
  logined = false
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
    await errorAlert(JSON.stringify(res)["message"])
    return
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


function labelStyle(element) {
  element.textColor = Color.black()
  element.textOpacity = 0.7
  element.font = Font.mediumSystemFont(13)
}

function valueStyle(element) {
  element.textColor = Color.white()
  element.font = Font.boldSystemFont(18)
}


async function Widgets() {
  let api = await sberFoodWallet(0)
  let widget = new ListWidget()
  widget.backgroundColor = new Color("ffb61d")
  widget = await createWidget(widget, api)
  try {
    if (config.widgetFamily === "large") {
      let text = widget.addText("\n")
      valueStyle(text)
      widget = await createWidget(widget, await sberFoodWallet(1))
    }
  } catch (err) {
    console.error(err)
  }
  return widget
}

async function createWidget(widget, api) {
  let appIcon = await loadAppIcon(api.logo)
  let title = api.name

  let startSymbol = SFSymbol.named("star.circle.fill")

  // Show title and logo
  let titleStack = widget.addStack()

  if (config.widgetFamily === "small") {
    let logoElement = titleStack.addImage(appIcon)
    logoElement.cornerRadius = 7
    logoElement.imageSize = new Size(15, 15)
    titleStack.addSpacer(8)
    let titleElement = titleStack.addText(title)
    labelStyle(titleElement)
    titleStack.setPadding(0, 0, 15, 0)

  } else {
    let titleElement = titleStack.addText(title)
    labelStyle(titleElement)
    titleStack.addSpacer()

    let logoElement = titleStack.addImage(appIcon)
    logoElement.cornerRadius = 20
    logoElement.imageSize = new Size(40, 40)
  }

  // Show Bonuses
  let bonusesStack = widget.addStack()

  bonusesStack.setPadding(0, 0, 15, 0)

  let bonusesTextElement = bonusesStack.addText("Бонусы:")
  labelStyle(bonusesTextElement)
  let bonuses = widget.addStack()

  let starElement = bonuses.addImage(startSymbol.image)
  starElement.imageSize = new Size(20, 20)
  starElement.tintColor = Color.white()

  let bonusesElement = bonuses.addText(api.balance.toString())
  valueStyle(bonusesElement)

  // Show Rank and Cashback
  if (config.widgetFamily !== "small") {

    let rankCashLabel = widget.addStack()

    let rankTextElement = rankCashLabel.addText("Уровень:")
    labelStyle(rankTextElement)
    rankCashLabel.addSpacer()

    let cashbackLabel = rankCashLabel.addText("Кешбек")
    labelStyle(cashbackLabel)

    let rankCashValue = widget.addStack()
    let rankElement = rankCashValue.addText(api.status)
    valueStyle(rankElement)

    rankCashValue.addSpacer()

    let cashbackValue = rankCashValue.addText(api.bonus.toString() + "%")
    valueStyle(cashbackValue)
  }
  return widget
}

async function loginWidget() {
  let widget = new ListWidget()
  widget.backgroundColor = new Color("ffb61d")

  let text = widget.addText("Для начала необходимо авторизоваться")
  valueStyle(text)
  return widget
}

async function sberFoodWallet(index) {
  let data = await loadWallet();
  let wallet = data[index]["wallet"];
  return {
    name: data[index]["network"]["name"],
    balance: wallet["balance"] / 100,
    status: wallet["currentRankName"],
    logo: wallet["logoImageUrl"],
    bonus: wallet["bonusPercentage"]
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
  return res["code"].toString().slice(1)
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
  a.message = "\n\n" + (await getCode()).insert(3, "  ") + "\n\n\nИли введите код с чека"
  a.addTextField("0000#0000", "5619#")
  a.addAction("Отправить")
  a.addCancelAction("Закрыть")

  let index = await a.present()
  if (index !== -1) {
    let code = a.textFieldValue(0).replace("#", "").insert(4, "#")
    let data = await activateCode(code)
    if (data.httpStatusCode && data.httpStatusCode === 500) {
      await errorAlert(data["message"])
      return
    }
    let statusNotifacion = new Notification();
    statusNotifacion.title = "Кешбек!"
    statusNotifacion.sound = "default"

    let organization = data["organization"]
    let wallet = organization["wallet"]
    let order = data["order"]
    let sum = order["orderFullSum"] / order["currency"]["centsCount"]
    let beforeBonuses = wallet["balance"] - sum / wallet["bonusPercentage"]
    statusNotifacion.body = `Покупка в " ${organization["organization"]["name"]}" на ${sum} ${order["currency"]["shortName"]}`
    statusNotifacion.subtitle = `${beforeBonuses} -> ${wallet["balance"]}`
    statusNotifacion.threadIdentifier = organization["id"]

    await statusNotifacion.schedule()
  }
}