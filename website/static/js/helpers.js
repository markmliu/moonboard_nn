var holdType = 2 // 1 is start, 2 is intermediate, 3 is finish
var clickedHolds = {}

function clearContents(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

function updateHoldType(radio) {
  holdType = parseInt(radio.value);
  console.log("holdType:", holdType);
}

function colorForHoldType(holdType) {
  if (holdType == 1){
    return "lightgreen";
  } else if (holdType ==2) {
    return "lightblue";
  }
  return "lightpink";
}

function validateHolds() {
  holds = Object.keys(clickedHolds);
  // Validation checking first
  if (holds.length == 0) {
    document.getElementById("predicted_grade").textContent="No holds selected";
    return false;
  }

  if (holds.length > 12) {
    document.getElementById("predicted_grade").textContent="More than 12 holds selected...";
    return false;
  }

  var num_start = 0;
  var num_end = 0;
  for (const [key, val] of Object.entries(clickedHolds)) {
    if (val == 1) {
      num_start++;
    }
    if (val == 3) {
      num_end++;
    }
  }

  if (num_start == 0) {
    document.getElementById("predicted_grade").textContent="No start holds selected";
    return false;
  }

  if (num_start > 2) {
    document.getElementById("predicted_grade").textContent="More than 2 start holds selected...";
    return false;
  }

  if (num_end == 0) {
    document.getElementById("predicted_grade").textContent="No end holds selected";
    return false;
  }

  if (num_end > 2) {
    document.getElementById("predicted_grade").textContent="More than 2 end holds selected...";
    return false;
  }

  // selected holds are valid, let buttons be clickable now
  document.getElementById("predicted_grade").textContent="";
  if (document.getElementById("grade-button").classList.contains("disabled")) {
    document.getElementById("grade-button").classList.remove("disabled");
    document.getElementById("grade-button").classList.add("enabled");
    document.getElementById("grade-button").disabled = false;
  };

  if (document.getElementById("share-button").classList.contains("disabled")) {
    document.getElementById("share-button").classList.remove("disabled");
    document.getElementById("share-button").classList.add("enabled");
    document.getElementById("share-button").disabled = false;
  };

  return true;
}

function clickHold(id, type) {
  target = document.getElementById(id);
  // toggle the clicked value
  let clicked_on = target.classList.toggle('m-clicked');
  if (clicked_on) {
    clickedHolds[target.id] = type;
    // set color appropriately
    target.style.borderColor = colorForHoldType(type);
    target.style.borderRadius = "50%";
    target.style.borderWidth = "4px";
    target.style.borderStyle = "solid";
  } else {
    delete clickedHolds[target.id];
    target.style.borderColor = "";
    target.style.borderRadius = "";
    target.style.borderWidth = "";
    target.style.borderStyle = "";
  }
  console.log(clickedHolds);
  validateHolds();
}

function onClickHold(event) {
  id = event.target.id;
  type = holdType;
  clickHold(id, type);
}

async function onClickGrade() {
  if (!validateHolds()) {
    return;
  }
  holds = Object.keys(clickedHolds);
  // send "clickedHolds" down to /grade endpoint
  var holds_json = JSON.stringify(holds);

  console.log(holds_json);

  fetch('/grade', {
    method: 'post',
    body: holds_json,
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      var predicted_grade = data["predicted_grade"];
      document.getElementById("predicted_grade").textContent=predicted_grade;

    })
    .catch(console.error);

}

function addClickedHoldsToURL() {
  if (!'URLSearchParams' in window) {
    console.log("not supported");
    return;
  }

  var searchParams = new URLSearchParams(window.location.search);

  for (const [k,v] of Object.entries(clickedHolds)) {
    searchParams.append(k, v.toString());
  }
  window.location.search = searchParams.toString();
}

function clickedHoldsFromStr(clickedHoldsStr) {
  let clickedHolds = {}
  for (let holdType in clickedHoldsStr.split(",")) {
    holdType=holdType.split(":")
    clickedHolds[holdType[0]]=holdType[1]
  }
  return clickedHolds;
}

function onClickShare() {
  if (!validateHolds()) {
    return;
  }

  addClickedHoldsToURL();
}

function addCallbacks() {
  holds = holds_2016

  var container = document.getElementById("moon-board");
  clearContents(container)

  for (i = 0; i < holds.length; i++) {
    var div = document.createElement('div');

    if (holds[i]) {
      div.id = holds[i][1];
      div.addEventListener('click', onClickHold);
    }

    container.append(div)
  }

  // add grade button callback
  var button = document.getElementById("grade-button");
  button.addEventListener('click', onClickGrade);

  var share_button = document.getElementById("share-button");
  share_button.addEventListener('click', onClickShare);

  // get anything in the query params
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  for (const [k,v] of Object.entries(params)) {
    clickHold(k, parseInt(v));
  }
  if (validateHolds()) {
    onClickGrade();
  }
}

window.onload = addCallbacks;
