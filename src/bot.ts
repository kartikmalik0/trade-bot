import TelegramBot from "node-telegram-bot-api";
import { createCanvas } from "canvas";
import QRCode from "qrcode";

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
    let minPrice = Math.min(...candleData.map(d => d.low));
    let maxPrice = Math.max(...candleData.map(d => d.high));
    const priceRange = maxPrice - minPrice;
    minPrice -= priceRange * 0.1; // Add some padding
    maxPrice += priceRange * 0.1;

    // Scale function
    function scaleY(price) {
        return chartMargin.top + chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
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
    const candleWidth = chartWidth / candleData.length * 0.6;
    candleData.forEach((candle, i) => {
        const x = chartMargin.left + (chartWidth / candleData.length) * i + (chartWidth / candleData.length) * 0.2;
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
        const y = chartMargin.top + chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
        ctx.fillText(`$${price.toFixed(0)}`, chartMargin.left - 10, y + 5);
    }

    // Draw time labels
    ctx.textAlign = "center";
    candleData.forEach((_, i) => {
        const x = chartMargin.left + (chartWidth / candleData.length) * i + (chartWidth / candleData.length) * 0.5;
        ctx.fillText(`Day ${i + 1}`, x, height - 20);
    });

    return canvas.toBuffer("image/png");
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
                "ℹ️ Available commands:\n/start\n/help\n/weather\n/news\n/profile\n/chart\n/candlestick\n/qrcode"
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
                    caption: "📈 Here's your candlestick chart with dummy trading data!",
                });
            } catch (err) {
                console.error(err);
                bot.sendMessage(chatId, "❌ Failed to generate candlestick chart.");
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

        default:
            bot.sendMessage(
                chatId,
                "❌ Unknown command. Type /help for options."
            );
    }
});

console.log("🤖 Telegram bot is running...");
export default bot;