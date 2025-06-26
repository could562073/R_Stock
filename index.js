import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import line from '@line/bot-sdk';

const config = {
  channelAccessToken: process.env.LINE_TOKEN,
  channelSecret: process.env.LINE_SECRET,
};

const app = express();

app.post('/webhook', line.middleware(config), async (req, res) => {
  const client = new line.Client(config);

  for (const event of req.body.events) {
    if (event.type === 'message' && event.message.type === 'text') {
      let text = event.message.text.trim();

      // 支援開頭 K 或 k，自動去掉
      if (/^k/i.test(text)) {
        text = text.replace(/^k/i, '').trim();
      }

      try {
        // 查詢台灣證交所熱門排行API
        const resp = await axios.get('https://openapi.twse.com.tw/v1/exchangeReport/MI_INDEX20');
        const data = resp.data;

        // 用「股票代碼」或「中文名稱」查詢
        const found = data.find(
          s => s.Code === text || s.Name === text
        );

        if (found) {
          // 多行精簡報表
          let msg =
            `數據統計日期：${found.Date}\n`
            `證券名稱：${found.Name} (${found.Code})\n` +
            `成交價：${found.ClosingPrice}\n` +
            `漲跌：${found.Change}\n` +
            `開盤價：${found.OpeningPrice}\n` +
            `最高價：${found.HighestPrice}\n` +
            `最低價：${found.LowestPrice}\n` +
            `成交股數：${found.TradeVolume}\n` +
            `成交金額：${found.TradeValue}\n` +
            `成交筆數：${found.Transaction}`;

          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: msg
          });
        } else {
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: `查無此股票：${text}`
          });
        }
      } catch (e) {
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'API查詢失敗，請稍後再試'
        });
      }
    }
  }
  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Line bot is running on ' + (process.env.PORT || 3000));
});