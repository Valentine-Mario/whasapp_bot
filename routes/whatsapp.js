var { MessageType } = require("@adiwajshing/baileys");
const pattern = new RegExp("^[0-9]+$");
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const Redis = require("ioredis");
const redis = new Redis(REDIS_URL);
const reply = require("./answers");

var hydrate = require("./hydrate");
exports.whatsapp = async (conn, req, res) => {
  try {
    if (req.body.toggle === "on") {
      res.json({
        succcess: true,
        message: `bot successfully toggled ${req.body.toggle}`,
      });
      hydrate.hydrate(conn);
    } else if (req.body.toggle === "off") {
      res.json({
        succcess: true,
        message: `bot successfully toggled ${req.body.toggle}`,
      });
      conn.on("chat-update", async (msg) => {
        //do nothing
      });
    } else {
      res.json({
        succcess: false,
        message: "Invalid input request",
      });
    }
  } catch (e) {
    return res.json({
      succcess: false,
      message: "error togggling bot. Please scan qr code again",
    });
  }
};

exports.interactive_reply = async (conn, chat, number) => {
  const anwer = reply.answers();
  const bad_reply=`Invalid message option ‼️\n
Please Type *BACK* to go back to the main menu`
   if (chat.toLowerCase().trim() === "bola") {
    const bola = `Thank you for contacting Bola, Please type your question below.\n 
Kindly be patient for my reply, i will be with you shortly ❤️`;

    await redis.set(`${number}`, `dont_reply`, "EX", 60 * 60 * 12);
    await conn.sendMessage(number, bola, MessageType.text);
    return
  } else if (chat.toLowerCase().trim() === "full") {
    await redis.set(`${number}`, "dont_reply", "EX", 60 * 60 * 12);
    return
  } else if (chat.toLowerCase().trim() === "confirm payment") {
    await conn.chatRead(number);
    await redis.set(`${number}`, "confirm", "EX", 60 * 60 * 12);
    await conn.sendMessage(number, anwer["confirm"], MessageType.text);
    return
  } else if (chat.match(pattern)) {
    const reply_num = anwer[`${chat}`];
    if(chat.trim()==="9"){
      await redis.set(`${number}`, `reply_9`, "EX", 60 * 60 * 12);
    }
    if (reply_num) {
      await conn.chatRead(number);
      await conn.sendMessage(number, reply_num, MessageType.text);
      return
    }else{
      await conn.chatRead(number);
      await conn.sendMessage(number, bad_reply, MessageType.text);
      return
    }
  }else{
    if(chat && (await redis.get(`${number}`))==="welcome"){
      await conn.chatRead(number);
      await conn.sendMessage(number, bad_reply, MessageType.text);
      return
    }
  }
};
