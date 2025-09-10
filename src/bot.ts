import TelegramBot from "node-telegram-bot-api";
import { createCanvas } from "canvas";
import QRCode from "qrcode";
import puppeteer from "puppeteer";

const token = "8402061747:AAFI88osH-k68jqVBbqiIl-CiQ2FTktQYAg";

if (!token) {
    console.error("❌ BOT_TOKEN is missing. Set it in your .env file.");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Set up command menu (shows command button near emoji icon)
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
]);

// Function to generate candlestick chart
function generateCandlestickChart() {
    const width = 800;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Draw background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height);

    // Chart area
    const chartMargin = { top: 50, right: 80, bottom: 60, left: 80 };
    const chartWidth = width - chartMargin.left - chartMargin.right;
    const chartHeight = height - chartMargin.top - chartMargin.bottom;

    // Dummy candlestick data (OHLC - Open, High, Low, Close)
    const candleData = [
        { open: 100, high: 120, low: 95, close: 115 },
        { open: 115, high: 135, low: 110, close: 125 },
        { open: 125, high: 140, low: 120, close: 130 },
        { open: 130, high: 145, low: 125, close: 135 },
        { open: 135, high: 150, low: 130, close: 140 },
        { open: 140, high: 155, low: 135, close: 145 },
        { open: 145, high: 160, low: 140, close: 150 },
        { open: 150, high: 165, low: 145, close: 155 },
        { open: 155, high: 170, low: 150, close: 160 },
        { open: 160, high: 175, low: 155, close: 165 },
    ];

    // Find min/max for scaling
    let minPrice = Math.min(...candleData.map((d) => d.low));
    let maxPrice = Math.max(...candleData.map((d) => d.high));
    const priceRange = maxPrice - minPrice;
    minPrice -= priceRange * 0.1; // Add some padding
    maxPrice += priceRange * 0.1;

    // Scale function
    function scaleY(price) {
        return (
            chartMargin.top +
            chartHeight -
            ((price - minPrice) / (maxPrice - minPrice)) * chartHeight
        );
    }

    // Draw grid lines
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
        const y = chartMargin.top + (chartHeight / 10) * i;
        ctx.beginPath();
        ctx.moveTo(chartMargin.left, y);
        ctx.lineTo(chartMargin.left + chartWidth, y);
        ctx.stroke();
    }

    // Draw vertical grid lines
    for (let i = 0; i <= candleData.length; i++) {
        const x = chartMargin.left + (chartWidth / candleData.length) * i;
        ctx.beginPath();
        ctx.moveTo(x, chartMargin.top);
        ctx.lineTo(x, chartMargin.top + chartHeight);
        ctx.stroke();
    }

    // Draw candlesticks
    const candleWidth = (chartWidth / candleData.length) * 0.6;
    candleData.forEach((candle, i) => {
        const x =
            chartMargin.left +
            (chartWidth / candleData.length) * i +
            (chartWidth / candleData.length) * 0.2;
        const openY = scaleY(candle.open);
        const closeY = scaleY(candle.close);
        const highY = scaleY(candle.high);
        const lowY = scaleY(candle.low);

        const isGreen = candle.close > candle.open;

        // Draw high-low line (wick)
        ctx.strokeStyle = isGreen ? "#00ff88" : "#ff4444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, highY);
        ctx.lineTo(x + candleWidth / 2, lowY);
        ctx.stroke();

        // Draw open-close rectangle (body)
        ctx.fillStyle = isGreen ? "#00ff88" : "#ff4444";
        const bodyHeight = Math.abs(closeY - openY);
        const bodyY = Math.min(openY, closeY);
        ctx.fillRect(x, bodyY, candleWidth, bodyHeight);

        // Draw border around body
        ctx.strokeStyle = isGreen ? "#00cc66" : "#cc3333";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, bodyY, candleWidth, bodyHeight);
    });

    // Draw title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Stock Price Candlestick Chart", width / 2, 30);

    // Draw price labels
    ctx.fillStyle = "#cccccc";
    ctx.font = "14px Arial";
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
        const price = minPrice + ((maxPrice - minPrice) / 5) * i;
        const y =
            chartMargin.top +
            chartHeight -
            ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
        ctx.fillText(`$${price.toFixed(0)}`, chartMargin.left - 10, y + 5);
    }

    // Draw time labels
    ctx.textAlign = "center";
    candleData.forEach((_, i) => {
        const x =
            chartMargin.left +
            (chartWidth / candleData.length) * i +
            (chartWidth / candleData.length) * 0.5;
        ctx.fillText(`Day ${i + 1}`, x, height - 20);
    });

    return canvas.toBuffer("image/png");
}

// Function to generate leaderboard image
async function generateLeaderboardImage() {
    // Generate random leaderboard data
    const players = [
        { name: "Player Alpha", score: Math.floor(Math.random() * 1000) + 500 },
        { name: "Player Beta", score: Math.floor(Math.random() * 900) + 400 },
        { name: "Player Gamma", score: Math.floor(Math.random() * 800) + 300 },
        { name: "Player Delta", score: Math.floor(Math.random() * 700) + 200 },
        { name: "Player Echo", score: Math.floor(Math.random() * 600) + 100 },
        { name: "Player Foxtrot", score: Math.floor(Math.random() * 500) + 50 },
        { name: "Player Golf", score: Math.floor(Math.random() * 400) + 25 },
        { name: "Player Hotel", score: Math.floor(Math.random() * 300) + 10 },
    ];

    // Sort by score descending
    players.sort((a, b) => b.score - a.score);

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
          width: 600px;
          height: 700px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Arial', sans-serif;
          color: white;
          padding: 40px;
          display: flex;
          flex-direction: column;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .title {
          font-size: 36px;
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          margin-bottom: 10px;
        }
        
        .subtitle {
          font-size: 16px;
          opacity: 0.8;
        }
        
        .leaderboard {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .player {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 15px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }
        
        .player.top-3 {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 193, 7, 0.2));
          border: 2px solid rgba(255, 215, 0, 0.5);
          box-shadow: 0 8px 32px rgba(255, 215, 0, 0.2);
        }
        
        .player.second {
          background: linear-gradient(135deg, rgba(192, 192, 192, 0.3), rgba(169, 169, 169, 0.2));
          border: 2px solid rgba(192, 192, 192, 0.5);
        }
        
        .player.third {
          background: linear-gradient(135deg, rgba(205, 127, 50, 0.3), rgba(184, 115, 51, 0.2));
          border: 2px solid rgba(205, 127, 50, 0.5);
        }
        
        .rank-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .rank {
          font-size: 24px;
          font-weight: bold;
          min-width: 60px;
        }
        
        .medal {
          font-size: 28px;
        }
        
        .name {
          font-size: 20px;
          font-weight: 600;
        }
        
        .score {
          font-size: 22px;
          font-weight: bold;
          color: #ffd700;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 14px;
          opacity: 0.7;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">🏆 LEADERBOARD</div>
        <div class="subtitle">Top Players Rankings</div>
      </div>
      
      <div class="leaderboard">
        ${players
            .map((player, index) => {
                const medals = ["🥇", "🥈", "🥉"];
                const rankClass =
                    index === 0
                        ? "top-3"
                        : index === 1
                        ? "second"
                        : index === 2
                        ? "third"
                        : "";

                return `
            <div class="player ${rankClass}">
              <div class="rank-info">
                <div class="rank">#${index + 1}</div>
                ${index < 3 ? `<div class="medal">${medals[index]}</div>` : ""}
                <div class="name">${player.name}</div>
              </div>
              <div class="score">${player.score.toLocaleString()}</div>
            </div>
          `;
            })
            .join("")}
      </div>
      
      <div class="footer">
        Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
      </div>
    </body>
    </html>
  `;

    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlTemplate);
    await page.setViewport({ width: 600, height: 700 });

    const buffer = await page.screenshot({
        type: "png",
        fullPage: true,
    });

    await browser.close();
    return buffer;
}

// Handle commands
bot.onText(/\/(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const command = match[1];

    switch (command) {
        case "start":
            bot.sendMessage(
                chatId,
                "👋 Welcome! Use the menu button to explore commands."
            );
            break;

        case "help":
            bot.sendMessage(
                chatId,
                "ℹ️ Available commands:\n/start\n/help\n/weather\n/news\n/profile\n/chart\n/candlestick\n/qrcode\n/leaderboard"
            );
            break;

        case "weather":
            bot.sendMessage(chatId, "🌤️ Today's weather is sunny, 30°C.");
            break;

        case "news":
            bot.sendMessage(chatId, "📰 Latest news: OpenAI launches GPT-5!");
            break;

        case "profile":
            bot.sendMessage(
                chatId,
                "👤 Your profile details will be here soon!"
            );
            break;

        case "chart":
            try {
                // Create canvas
                const width = 600;
                const height = 400;
                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext("2d");

                // Draw background
                ctx.fillStyle = "#fff";
                ctx.fillRect(0, 0, width, height);

                // Draw dummy bar chart
                const data = [150, 250, 100, 300, 200];
                const barWidth = 80;
                const barGap = 30;
                const xStart = 50;
                const yBase = 350;

                ctx.fillStyle = "#3498db";
                data.forEach((val, i) => {
                    const x = xStart + i * (barWidth + barGap);
                    const y = yBase - val;
                    ctx.fillRect(x, y, barWidth, val);

                    // Add labels
                    ctx.fillStyle = "#000";
                    ctx.font = "20px Arial";
                    ctx.fillText(`${val}`, x + 20, y - 10);
                    ctx.fillStyle = "#3498db";
                });

                // Send image as buffer
                const buffer = canvas.toBuffer("image/png");
                await bot.sendPhoto(chatId, buffer, {
                    caption: "📊 Here's your generated chart!",
                });
            } catch (err) {
                console.error(err);
                bot.sendMessage(chatId, "❌ Failed to generate chart.");
            }
            break;

        case "candlestick":
            try {
                const buffer = generateCandlestickChart();
                await bot.sendPhoto(chatId, buffer, {
                    caption:
                        "📈 Here's your candlestick chart with dummy trading data!",
                });
            } catch (err) {
                console.error(err);
                bot.sendMessage(
                    chatId,
                    "❌ Failed to generate candlestick chart."
                );
            }
            break;

        case "qrcode":
            try {
                const text = "https://kartikmalik.me"; // any text or URL you want
                const qrBuffer = await QRCode.toBuffer(text, { width: 300 });
                await bot.sendPhoto(chatId, qrBuffer, {
                    caption: `🔗 QR Code for: ${text}`,
                });
            } catch (err) {
                console.error(err);
                bot.sendMessage(chatId, "❌ Failed to generate QR code.");
            }
            break;

        case "leaderboard":
            try {
                const buffer = await generateLeaderboardImage();
                await bot.sendPhoto(chatId, buffer, {
                    caption: "🏆 Leaderboard with dynamic data!",
                });
            } catch (err) {
                console.error(err);
                bot.sendMessage(chatId, "❌ Failed to generate leaderboard.");
            }
            break;

        default:
            bot.sendMessage(
                chatId,
                "❌ Unknown command. Type /help for options."
            );
    }
});

console.log("🤖 Telegram bot is running...");
export default bot;
