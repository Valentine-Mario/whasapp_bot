var express = require("express");
var router = express.Router();
var { WAConnection } = require("@adiwajshing/baileys");
const Pusher = require("pusher");
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const Redis = require("ioredis");
const redis = new Redis(REDIS_URL);
const wa_client = require("./whatsapp");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.post("/toggle", async (req, res) => {
  try{
    const conn = new WAConnection();

    await redis.set("toggle", req.body.toggle);
    let auth = await redis.get("auth");
  
    conn.loadAuthInfo(JSON.parse(auth));
  
  
    await conn.connect();
    await wa_client.whatsapp(conn, req, res);
  }catch(e){
    return res.json({
      succcess: false,
      message: "error togggling bot. Please scan qr code again",
    });
  }
  
});

router.get("/updatecred", async (req, res) => {
  try {
    const pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
    });
    const conn = new WAConnection();

    conn.on("qr", (qr) => {
      pusher.trigger("chan", "qr", qr);
    });

    conn.regenerateQRIntervalMs = 20000;
    await conn.connect();
    const session = conn.base64EncodedAuthInfo();
    await redis.set("auth", JSON.stringify(session));
    res.json({ succcess: true, message: "scan successful" });
  } catch (e) {
    console.log(e);
  }
});

router.post("/msg1", async (req, res) => {
  try {
    await redis.set("old_customers", req.body.special_msg);
    res.json({ succcess: true, message: req.body.special_msg });
  } catch (e) {
    console.log(e);
  }
});

router.post("/msg2", async (req, res) => {
  try {
    await redis.set("new_customers", req.body.other_msg);
    res.json({ succcess: true, message: req.body.other_msg });
  } catch (e) {
    console.log(e);
  }
});

router.get("/dbdata", async (req, res) => {
  try {
    const bot_status = await redis.get("toggle");
    let clients = await redis.get("clients");
    let old_customers = await redis.get("old_customers");
    let new_customers = await redis.get("new_customers");
    if(clients===null){
      let data = {
        toggle: bot_status,
        special_msg: old_customers,
        other_msg: new_customers,
        clients: [],
      };
      return res.json({ succcess: true, message: data });
    }else{
      let data = {
        toggle: bot_status,
        special_msg: old_customers,
        other_msg: new_customers,
        clients: clients.split("|"),
      };
      return res.json({ succcess: true, message: data });
    }
   
  } catch (e) {
    console.log(e);
  }
});

router.post("/addclient", async (req, res) => {
  try {
    let clients = await redis.get("clients");
    if (clients === null) {
      await redis.set("clients", `${req.body.number}@s.whatsapp.net`);
      res.json({ succcess: true, message: "client added successfully" });
    } else {
      if (clients.split("|").includes(req.body.number + "@s.whatsapp.net")) {
        return res.json({
          succcess: false,
          message: "this number already exist",
        });
      } else { let num = clients + `|${req.body.number}@s.whatsapp.net`;
        await redis.set("clients", num);

        res.json({ succcess: true, message: `${req.body.number}@s.whatsapp.net` });
      }
    }
  } catch (e) {
    console.log(e);
  }
});

router.post("/removeclient", async (req, res) => {
  try {
    let clients = await redis.get("clients");
    if(clients){
      let list = clients.split("|");

    if (list.includes(req.body.number + "@s.whatsapp.net")) {
      list.splice(list.indexOf(req.body.number + "@s.whatsapp.net"), 1);
      if(list.length===0){
        await redis.del("clients")
        res.json({ succcess: true, message: "none client removed successfully" });
      }else{
        let val= list.join("|")
        await redis.set("clients", val);
        res.json({ succcess: true, message: "non client removed successfully" });
      }
      
    } else {
      return res.json({
        succcess: false,
        message: "number you're trying to delete does not exist",
      });
    }
    }else{
      return res.json({
        succcess:false,
        message:"non client list empty"
      })
    }
    
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;