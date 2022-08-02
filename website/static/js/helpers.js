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

  document.getElementById("predicted_grade").textContent="";
  return true;
}

function validateHoldsAndUpdateButtons() {
  let valid = validateHolds();
  if (valid) {
    // selected holds are valid, let buttons be clickable now
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
  } else {
    // selected holds are not valid, disable buttons now
    if (document.getElementById("grade-button").classList.contains("enabled")) {
      document.getElementById("grade-button").classList.remove("enabled");
      document.getElementById("grade-button").classList.add("disabled");
      document.getElementById("grade-button").disabled = true;;
    };
    if (document.getElementById("share-button").classList.contains("enabled")) {
      document.getElementById("share-button").classList.remove("enabled");
      document.getElementById("share-button").classList.add("disabled");
      document.getElementById("share-button").disabled = true;;
    };
    return false;
  }

}

function toggleHoldState(id, type) {
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
  validateHoldsAndUpdateButtons();
}

function onClickHold(event) {
  id = event.target.id;
  type = holdType;
  toggleHoldState(id, type);
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

function copyToClipboard(textToCopy) {
    // text area method
    let textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    // make the textarea out of viewport
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    return new Promise((res, rej) => {
        // here the magic happens
        document.execCommand('copy') ? res() : rej();
        textArea.remove();
    });
}

function addClickedHoldsToURL() {
  if (!'URLSearchParams' in window) {
    console.log("not supported");
    return;
  }

  var searchParams = new URLSearchParams();

  for (const [k,v] of Object.entries(clickedHolds)) {
    if (!searchParams.has(k)) {
      searchParams.append(k, v.toString());
    }
  }
  let base_url = window.location.href.split('?')[0];
  copyToClipboard(base_url+"?"+searchParams.toString()).then(
    function() {
      /* clipboard successfully set */
      window.alert('Url copied to clipboard')
    },
    function() {
      /* clipboard write failed */
      window.alert('Opps! Your browser does not support the Clipboard API')
    }
  )
  window.location.search = searchParams.toString();
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
    toggleHoldState(k, parseInt(v));
  }
  if (validateHolds()) {
    onClickGrade();
  }
}

window.onload = addCallbacks;
