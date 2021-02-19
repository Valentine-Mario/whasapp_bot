const base_url = "http://localhost:3000";
document.getElementById("spc_form").style.display = "none";
document.getElementById("oth_form").style.display = "none";
document.getElementById("qrcode_scan").style.display="none";

getData();
var pusher = new Pusher("0fdf0851bfed97e22bf0", {
  cluster: "eu",
});
var channel = pusher.subscribe("chan");
channel.bind("qr", (data) => {
  document.getElementById("qrloading").style.display="none"
  document.getElementById("qrinstructions").style.display="block"

  jQuery("#qrcode").qrcode({
    text: data,
  });
});

function generateQrCode() {
  document.getElementById("qrcode_scan").style.display="block";
  document.getElementById("qrloading").style.display="block"
  document.getElementById("qrinstructions").style.display="none"

  fetch(base_url + "/updatecred")
    .then((response) => response.json())
    .then((data) => {
      pusher.disconnect();
      alert(data.message);
      document.getElementById("qrcode_scan").style.display="none"
      document.getElementById("qrcode").style.display="none"
    });
}

function getData() {
  fetch(base_url + "/dbdata")
    .then((response) => response.json())
    .then((data) => {
      if (data.succcess === true) {
        listItem(data.message.clients);

        document.getElementById("special_msg").innerHTML =
          data.message.special_msg;
        document.getElementById("special_field").value =
          data.message.special_msg;

        //for other clients
        document.getElementById("other_msg").innerHTML = data.message.other_msg;
        document.getElementById("other_field").value = data.message.other_msg;

        document.getElementById("bot_info").innerHTML = data.message.toggle;

        var options = "";
        options += "<option> " + "select client" + "</option>";
        for (var i = 0, len = data.message.clients.length; i < len; i++) {
          var item = data.message.clients[i];
          options +=
            "<option> " + item.substring(0, item.indexOf("@")) + "</option>";
        }
        document.getElementById("dropdown").innerHTML = options;
      } else {
        alert(data.message);
      }
    });
}

function listItem(arr) {
  for (var a of arr) {
    let listTag = document.createElement("li");
    listTag.innerHTML = a.substring(0, a.indexOf("@"));
    listTag.id = a;
    document.getElementById("list").appendChild(listTag);
  }
}

function addToList() {
  var fieldVal = document.getElementById("myField").value.trim();
  postData(base_url + "/addclient", {
    number: fieldVal,
  })
    .then((data) => {
      alert(data.message);
    })
    .catch((err) => {
      console.log(err);
    });
}

function removeList() {
  postData(base_url + "/removeclient", {
    number: document.getElementById("dropdown").value,
  })
    .then((data) => {
      if (data.succcess === true) {
        alert(data.message);
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

document.getElementById("show_spc_form").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("spc_form").style.display = "block";
  document.getElementById("show_spc").style.display = "none";
});

document.getElementById("hide_spc_form").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("spc_form").style.display = "none";
  document.getElementById("show_spc").style.display = "block";
});

//submit special client form
document.getElementById("sub_spc_form").addEventListener("click", (e) => {
  e.preventDefault();
  postData(base_url + "/msg1", {
    special_msg: document.getElementById("special_field").value,
  })
    .then((data) => {
      document.getElementById("spc_form").style.display = "none";
      document.getElementById("show_spc").style.display = "block";
      document.getElementById("special_msg").innerHTML = data.message;
    })
    .catch((err) => {
      console.log(err);
    });
});

document.getElementById("show_oth_form").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("oth_form").style.display = "block";
  document.getElementById("show_oth").style.display = "none";
});

document.getElementById("hide_oth_form").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("oth_form").style.display = "none";
  document.getElementById("show_oth").style.display = "block";
});

//submit other client form
document.getElementById("sub_oth_form").addEventListener("click", (e) => {
  e.preventDefault();
  postData(base_url + "/msg2", {
    other_msg: document.getElementById("other_field").value,
  })
    .then((data) => {
      document.getElementById("oth_form").style.display = "none";
      document.getElementById("show_oth").style.display = "block";
      document.getElementById("other_msg").innerHTML = data.message;
    })
    .catch((err) => {
      console.log(err);
    });
});

document.getElementById("toggle").addEventListener("change", (e) => {
  e.preventDefault();
  document.getElementById("bot_loading").innerHTML=`Bot is turning ${document.getElementById("toggle").value}...`
  postData(base_url + "/toggle", {
    toggle: document.getElementById("toggle").value,
  })
    .then((data) => {
      console.log(data)
      document.getElementById("bot_loading").innerHTML=""
      document.getElementById("bot_info").innerHTML =  document.getElementById("toggle").value;
      alert(data.message);
    })
    .catch((err) => {
      alert(err.message);
    });
});

function postData(url, data) {
  return new Promise((res, rej) => {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify(data);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch(url, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        res(result);
      })
      .catch((error) => rej(error));
  });
}
