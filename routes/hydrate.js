const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const Redis = require("ioredis");
const redis = new Redis(REDIS_URL);
var wa_interact = require("./whatsapp");
var { MessageType } = require("@adiwajshing/baileys");
const reply = require("./answers");

exports.hydrate = async (conn) => {
  try {
    console.log("oh hello " + conn.user.name + "! You connected");
    conn.on("chat-update", async (msg) => {
      //avoid sending messages to group chat status, self or broadcast or none clients
      let clients = await redis.get("clients");
      let old_customers = await redis.get("old_customers");
      let new_customers = await redis.get("new_customers");

      if (clients !== null) {
        let list = clients.split("|");
        if (list.includes(msg.jid)) {
          return;
        }
      }
      if(msg.jid.includes("@g.us")){
        await conn.chatRead(msg.jid);
        return
      }
      if (msg.messages!==undefined) {
        if (
          msg.messages.array[0].key.fromMe &&
          msg.messages.array[0].message.conversation.toLowerCase().trim() ===
            "stop"
        ) {
          await redis.set(
            `${msg.messages.array[0].key.remoteJid}`,
            "dont_reply",
            "EX",
            60 * 60 * 12
          );
          return;
        }

        if (
          msg.messages.array[0].key.fromMe &&
          msg.messages.array[0].message.conversation.toLowerCase().trim() ===
            "continue"
        ) {
          await redis.set(
            `${msg.messages.array[0].key.remoteJid}`,
            "welcome",
            "EX",
            60 * 60 * 12
          );
          return;
        }
        if (
          msg.jid.includes("status") ||
          msg.messages.array[0].key.fromMe ||
          msg.jid.includes("broadcast")||
          msg.jid.includes("@g.us")
        ) {
          return;
        } else {
          const state = await redis.get(`${msg.jid}`);
          // const msg_history = await conn.loadMessages(msg.jid, 100);
          const anwer = reply.answers();
          //if state is null and has chat history
          if (state === null ) {
            //mark message as read
            await conn.chatRead(msg.jid);
            await redis.set(`${msg.jid}`, "welcome", "EX", 60 * 60 * 12);
            await conn.sendMessage(
              msg.jid,
              old_customers + `\n\n${anwer["welcome"]}`,
              MessageType.text
            );
            return;
          }
          // } else if (state === null && msg_history.messages.length < 3) {
          //   //mark message as read
          //   await conn.chatRead(msg.jid);
          //   await redis.set(`${msg.jid}`, "welcome", "EX", 60 * 60 * 12);
          //   await conn.sendMessage(
          //     msg.jid,
          //     new_customers + `\n\n${anwer["welcome"]}`,
          //     MessageType.text
          //   );
          //   return;
          //}
           else if (
            msg.messages.array[0].message.conversation.toLowerCase().trim() ===
            "back"
          ) {
            await conn.chatRead(msg.jid);
            await conn.sendMessage(msg.jid, anwer["welcome"], MessageType.text);
            await redis.set(`${msg.jid}`, "welcome", "EX", 60 * 60 * 12);
          } else if (state === "welcome") {
            //get converstion
            let chat = msg.messages.array[0].message.conversation;
            wa_interact.interactive_reply(conn, chat, msg.jid);
            return;
          } else if (state === "confirm") {
            await conn.sendMessage(
              msg.jid,
              anwer["reply_confirm"],
              MessageType.text
            );
            await redis.set(`${msg.jid}`, "dont_reply", "EX", 60 * 60 * 12);
          } else if (state === "reply_9") {
            await conn.sendMessage(msg.jid, anwer["reply_9"], MessageType.text);
            await redis.set(`${msg.jid}`, "dont_reply", "EX", 60 * 60 * 12);
          } else if (state === "dont_reply") {
            return;
          } else {
            return;
          }
        }
      }else{
        console.log("waiting...")
      }
    });
  } catch (e) {
    console.log(e);
  }
};
