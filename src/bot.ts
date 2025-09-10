import TelegramBot from "node-telegram-bot-api"
import { createCanvas } from "canvas"
import puppeteer from "puppeteer"

const token = "8402061747:AAFI88osH-k68jqVBbqiIl-CiQ2FTktQYAg"

if (!token) {
  console.error("❌ BOT_TOKEN is missing. Set it in your .env file.")
  process.exit(1)
}

const bot = new TelegramBot(token, { polling: true })

// Set up command menu
bot.setMyCommands([
  { command: "start", description: "Start the bot" },
  { command: "help", description: "Get help info" },
  { command: "weather", description: "Get today's weather" },
  { command: "news", description: "Latest news" },
  { command: "profile", description: "Show your profile" },
  { command: "chart", description: "Generate a chart image" },
  { command: "candlestick", description: "Generate a candlestick chart" },
  { command: "qrcode", description: "Generate a QR code" },
  { command: "leaderboard", description: "Generate a leaderboard image" },
  { command: "pnl", description: "Generate a P&L trading card" },
])

/**
 * Generate realistic candlestick data for the last 6 days with hourly candles
 */
function generateHourlyCandles() {
  const candles = []
  const now = new Date()
  let price = 100 // starting price

  for (let d = 5; d >= 0; d--) {
    const day = new Date()
    day.setDate(now.getDate() - d)

    for (let h = 0; h < 24; h++) {
      const time = new Date(day)
      time.setHours(h)

      const open = price
      const high = open + Math.random() * 10
      const low = open - Math.random() * 10
      const close = low + Math.random() * (high - low)

      price = close // next candle starts from last close

      candles.push({
        time,
        open,
        high,
        low,
        close,
      })
    }
  }

  return candles
}

/**
 * Generate candlestick chart image
 */
function generateCandlestickChart() {
  const width = 1000
  const height = 600
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  const candleData = generateHourlyCandles()

  // Draw background
  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, width, height)

  // Chart area
  const chartMargin = { top: 50, right: 30, bottom: 80, left: 80 }
  const chartWidth = width - chartMargin.left - chartMargin.right
  const chartHeight = height - chartMargin.top - chartMargin.bottom

  // Find min/max for scaling
  let minPrice = Math.min(...candleData.map((d) => d.low))
  let maxPrice = Math.max(...candleData.map((d) => d.high))
  const priceRange = maxPrice - minPrice
  minPrice -= priceRange * 0.05
  maxPrice += priceRange * 0.05

  // Scale Y
  const scaleY = (price) => chartMargin.top + chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight

  // Draw grid lines
  ctx.strokeStyle = "#333"
  ctx.lineWidth = 1
  for (let i = 0; i <= 10; i++) {
    const y = chartMargin.top + (chartHeight / 10) * i
    ctx.beginPath()
    ctx.moveTo(chartMargin.left, y)
    ctx.lineTo(chartMargin.left + chartWidth, y)
    ctx.stroke()
  }

  // Draw candlesticks
  const candleWidth = (chartWidth / candleData.length) * 0.7
  candleData.forEach((candle, i) => {
    const x = chartMargin.left + (chartWidth / candleData.length) * i + (chartWidth / candleData.length) * 0.15

    const openY = scaleY(candle.open)
    const closeY = scaleY(candle.close)
    const highY = scaleY(candle.high)
    const lowY = scaleY(candle.low)

    const isGreen = candle.close >= candle.open

    // Wick (high-low line)
    ctx.strokeStyle = isGreen ? "#00ff88" : "#ff4444"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x + candleWidth / 2, highY)
    ctx.lineTo(x + candleWidth / 2, lowY)
    ctx.stroke()

    // Candle body
    ctx.fillStyle = isGreen ? "#00ff88" : "#ff4444"
    const bodyHeight = Math.abs(closeY - openY)
    const bodyY = Math.min(openY, closeY)
    ctx.fillRect(x, bodyY, candleWidth, Math.max(bodyHeight, 1))
  })

  // Draw title
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 24px Arial"
  ctx.textAlign = "center"
  ctx.fillText("📈 Last 6 Days Candlestick Chart (Hourly)", width / 2, 30)

  // Draw price labels
  ctx.fillStyle = "#cccccc"
  ctx.font = "14px Arial"
  ctx.textAlign = "right"
  for (let i = 0; i <= 5; i++) {
    const price = minPrice + ((maxPrice - minPrice) / 5) * i
    const y = chartMargin.top + chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight
    ctx.fillText(`$${price.toFixed(2)}`, chartMargin.left - 10, y + 5)
  }

  // Draw day labels (only show one label per day)
  ctx.textAlign = "center"
  ctx.fillStyle = "#cccccc"
  ctx.font = "12px Arial"
  const step = 24 // hourly candles → 24 per day
  for (let i = 0; i < candleData.length; i += step) {
    const x = chartMargin.left + (chartWidth / candleData.length) * i + (chartWidth / candleData.length) * 0.5
    const dayLabel = candleData[i].time.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    ctx.fillText(dayLabel, x, height - 30)
  }

  return canvas.toBuffer("image/png")
}

/**
 * Generate leaderboard image
 */
async function generateLeaderboardImage() {
  const players = [
    { name: "Player Alpha", score: Math.floor(Math.random() * 1000) + 500 },
    { name: "Player Beta", score: Math.floor(Math.random() * 900) + 400 },
    { name: "Player Gamma", score: Math.floor(Math.random() * 800) + 300 },
    { name: "Player Delta", score: Math.floor(Math.random() * 700) + 200 },
    { name: "Player Echo", score: Math.floor(Math.random() * 600) + 100 },
    { name: "Player Foxtrot", score: Math.floor(Math.random() * 500) + 50 },
  ]

  players.sort((a, b) => b.score - a.score)

  const htmlTemplate = `
    <html>
      <body style="width:600px;height:700px;background:#222;color:#fff;font-family:sans-serif;padding:20px;">
        <h1 style="text-align:center;">🏆 Leaderboard</h1>
        ${players
          .map(
            (p, i) =>
              `<div style="margin:10px;padding:10px;border-radius:8px;background:#333;display:flex;justify-content:space-between;">
                      <span>#${i + 1} ${p.name}</span>
                      <b>${p.score}</b>
                    </div>`,
          )
          .join("")}
      </body>
    </html>`

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  await page.setContent(htmlTemplate)
  await page.setViewport({ width: 600, height: 700 })
  const buffer = await page.screenshot({ type: "png", fullPage: true })
  await browser.close()
  return buffer
}

/**
 * Generate P&L trading card with dummy data
 */
async function generatePnLCard() {
  // Generate realistic dummy data
  const tradingPairs = ["BTCUSDT", "ETHUSDT", "ADAUSDT", "SOLUSDT", "DOGEUSDT"]
  const positions = ["Long", "Short"]
  const leverages = ["10X", "25X", "50X", "100X", "125X"]

  const pair = tradingPairs[Math.floor(Math.random() * tradingPairs.length)]
  const position = positions[Math.floor(Math.random() * positions.length)]
  const leverage = leverages[Math.floor(Math.random() * leverages.length)]

  // Generate profit/loss percentage (-100% to +200%)
  const pnlPercent = (Math.random() * 300 - 100).toFixed(6)
  const isProfit = Number.parseFloat(pnlPercent) > 0

  // Generate prices
  const entryPrice = (Math.random() * 50000 + 1000).toFixed(2)
  const markPrice = (Number.parseFloat(entryPrice) * (1 + Number.parseFloat(pnlPercent) / 100)).toFixed(2)

  // Generate user data
  const userId = Math.floor(Math.random() * 9999) + 1000
  const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  // Current timestamp
  const now = new Date()
  const sharingTime = now.toLocaleDateString("en-GB") + " " + now.toLocaleTimeString("en-GB")

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                width: 900px;
                height: 550px;
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%);
                color: white;
                font-family: 'Segoe UI', 'Arial', sans-serif;
                position: relative;
                border-radius: 24px;
                overflow: hidden;
                border: 3px solid #333;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
            }
            
            .background-pattern {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-image: 
                    radial-gradient(circle at 20% 80%, rgba(255, 215, 0, 0.05) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(0, 255, 136, 0.03) 0%, transparent 50%),
                    radial-gradient(circle at 40% 40%, rgba(255, 68, 68, 0.03) 0%, transparent 50%);
                pointer-events: none;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 25px 35px;
                background: rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .logo {
                font-size: 32px;
                font-weight: 900;
                background: linear-gradient(45deg, #ffd700, #ffed4e);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
                letter-spacing: -1px;
            }
            
            .user-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .avatar {
                width: 45px;
                height: 45px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 18px;
                border: 2px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            
            .user-id {
                font-size: 20px;
                font-weight: 700;
                color: #e0e0e0;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
            }
            
            .main-content {
                padding: 35px 40px;
                position: relative;
                z-index: 2;
            }
            
            .trading-pair {
                font-size: 42px;
                font-weight: 900;
                margin-bottom: 12px;
                color: #ffffff;
                text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
                letter-spacing: -1px;
            }
            
            .position-info {
                display: flex;
                align-items: center;
                gap: 18px;
                margin-bottom: 35px;
            }
            
            .position-type {
                color: ${position === "Long" ? "#00ff88" : "#ff4444"};
                font-size: 20px;
                font-weight: 800;
                text-shadow: 0 0 10px ${position === "Long" ? "rgba(0, 255, 136, 0.4)" : "rgba(255, 68, 68, 0.4)"};
            }
            
            .separator {
                color: #666;
                font-size: 20px;
                font-weight: 300;
            }
            
            .leverage {
                color: #ccc;
                font-size: 20px;
                font-weight: 600;
            }
            
            .pnl-percentage {
                font-size: 84px;
                font-weight: 900;
                color: ${isProfit ? "#00ff88" : "#ff4444"};
                text-shadow: 
                    0 0 20px ${isProfit ? "rgba(0, 255, 136, 0.5)" : "rgba(255, 68, 68, 0.5)"},
                    3px 3px 10px rgba(0, 0, 0, 0.8);
                margin-bottom: 45px;
                line-height: 0.9;
                letter-spacing: -2px;
                background: ${
                  isProfit ? "linear-gradient(135deg, #00ff88, #00cc6a)" : "linear-gradient(135deg, #ff4444, #cc3333)"
                };
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .price-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 50px;
                margin-bottom: 35px;
            }
            
            .price-item {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .price-label {
                color: #888;
                font-size: 16px;
                text-transform: uppercase;
                letter-spacing: 2px;
                font-weight: 600;
            }
            
            .price-value {
                color: #ffffff;
                font-size: 28px;
                font-weight: 800;
                text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.6);
            }
            
            .footer-info {
                position: absolute;
                bottom: 25px;
                left: 40px;
                right: 40px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: #777;
                font-size: 15px;
                font-weight: 500;
            }
            
            .referral-code {
                color: #999;
                font-weight: 600;
            }
            
            .sharing-time {
                color: #777;
                font-weight: 500;
            }
            
            .mascot {
                position: absolute;
                right: 40px;
                top: 45%;
                transform: translateY(-50%);
                font-size: 140px;
                opacity: 0.8;
                filter: drop-shadow(0 0 20px rgba(0, 0, 0, 0.5));
                z-index: 1;
            }
            
            .qr-code {
                position: absolute;
                bottom: 25px;
                right: 25px;
                width: 90px;
                height: 90px;
                background: linear-gradient(135deg, #ffffff, #f0f0f0);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #000;
                font-size: 11px;
                font-weight: 800;
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
                border: 2px solid rgba(255, 255, 255, 0.9);
            }
            
            .glow-effect {
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(45deg, 
                    rgba(255, 215, 0, 0.1), 
                    rgba(0, 255, 136, 0.1), 
                    rgba(255, 68, 68, 0.1));
                border-radius: 26px;
                z-index: -1;
                animation: glow 3s ease-in-out infinite alternate;
            }
            
            @keyframes glow {
                from { opacity: 0.5; }
                to { opacity: 0.8; }
            }
            
            .profit-indicator {
                position: absolute;
                top: 20px;
                right: 20px;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${isProfit ? "#00ff88" : "#ff4444"};
                box-shadow: 0 0 15px ${isProfit ? "rgba(0, 255, 136, 0.6)" : "rgba(255, 68, 68, 0.6)"};
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
            }
        </style>
    </head>
    <body>
        <div class="glow-effect"></div>
        <div class="background-pattern"></div>
        <div class="profit-indicator"></div>
        
        <div class="header">
            <div class="logo">BloFin</div>
            <div class="user-info">
                <div class="avatar">${userId.toString().slice(-2)}</div>
                <div class="user-id">${userId}</div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="trading-pair">${pair} Perp</div>
            
            <div class="position-info">
                <span class="position-type">${position}</span>
                <span class="separator">|</span>
                <span class="leverage">${leverage}</span>
            </div>
            
            <div class="pnl-percentage">${isProfit ? "+" : ""}${pnlPercent}%</div>
            
            <div class="price-info">
                <div class="price-item">
                    <div class="price-label">Entry Price</div>
                    <div class="price-value">${entryPrice}</div>
                </div>
                <div class="price-item">
                    <div class="price-label">Mark Price</div>
                    <div class="price-value">${markPrice}</div>
                </div>
            </div>
            
            <div class="mascot">${isProfit ? "🚀" : "😭"}</div>
        </div>
        
        <div class="footer-info">
            <div class="referral-code">Referral code: ${referralCode}</div>
            <div class="sharing-time">Sharing Time: ${sharingTime}</div>
        </div>
        
        <div class="qr-code">
            <div>QR<br/>CODE</div>
        </div>
    </body>
    </html>`

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
  const page = await browser.newPage()
  await page.setContent(htmlTemplate)
  await page.setViewport({ width: 900, height: 550 })
  const buffer = await page.screenshot({
    type: "png",
    fullPage: false,
    clip: { x: 0, y: 0, width: 900, height: 550 },
  })
  await browser.close()
  return buffer
}

// Handle commands
bot.onText(/\/(.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const command = match[1]

  switch (command) {
    case "candlestick":
      try {
        const buffer = generateCandlestickChart()
        await bot.sendPhoto(chatId, buffer, {
          caption: "📊 Last 6 days hourly candlestick chart!",
        })
      } catch (err) {
        console.error(err)
        bot.sendMessage(chatId, "❌ Failed to generate candlestick chart.")
      }
      break

    case "leaderboard":
      try {
        const buffer = await generateLeaderboardImage()
        await bot.sendPhoto(chatId, buffer, { caption: "🏆 Leaderboard" })
      } catch (err) {
        console.error(err)
        bot.sendMessage(chatId, "❌ Failed to generate leaderboard.")
      }
      break

    case "pnl":
      try {
        const buffer = await generatePnLCard()
        await bot.sendPhoto(chatId, buffer, {
          caption: "💰 Your P&L Trading Card - Professional trading summary!",
        })
      } catch (err) {
        console.error(err)
        bot.sendMessage(chatId, "❌ Failed to generate P&L card.")
      }
      break

    default:
      bot.sendMessage(chatId, "❌ Unknown command. Use /help")
  }
})

console.log("🤖 Telegram bot is running...")
export default bot
