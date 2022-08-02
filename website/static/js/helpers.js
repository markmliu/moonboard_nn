var holdType = 2 // 1 is start, 2 is intermediate, 3 is finish
var clickedHolds = {}
var PROBLEM_NAME = null

function clearContents(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

function setName(name) {
  document.getElementById("problem-name").textContent=name;
  PROBLEM_NAME = name;
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

function enable_button(id) {
    if (document.getElementById(id).classList.contains("disabled")) {
      document.getElementById(id).classList.remove("disabled");
      document.getElementById(id).classList.add("enabled");
      document.getElementById(id).disabled = false;
    };
}

function disable_button(id) {
    if (document.getElementById(id).classList.contains("enabled")) {
      document.getElementById(id).classList.remove("enabled");
      document.getElementById(id).classList.add("disabled");
      document.getElementById(id).disabled = true;
    };
}

function validateHoldsAndUpdateButtons() {
  let valid = validateHolds();
  if (valid) {
    enable_button("grade-button");
    enable_button("share-button");
    enable_button("name-button");

    return true;
  } else {
    disable_button("grade-button");
    disable_button("share-button");
    disable_button("name-button");

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
  let holds_json = JSON.stringify(holds);

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

function addClickedHoldsAndNameToURL() {
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

  if (PROBLEM_NAME) {
    searchParams.append("name", PROBLEM_NAME);
  }

  let base_url = window.location.href.split('?')[0];

  let final_url = base_url+"?"+searchParams.toString();
  let copy_str = "I made a moonboard problem";
  if (PROBLEM_NAME) {
    copy_str += " named " + PROBLEM_NAME;
  }
  copy_str += ". Check it out at: " + final_url

  copyToClipboard(copy_str).then(
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

  addClickedHoldsAndNameToURL();
}

function onClickName() {
  if (!validateHolds()) {
    return;
  }
  holds = Object.keys(clickedHolds);
	request = {"holds": holds};
  request["name_prefix"] = document.getElementById('name-prefix').value;

  console.log(request);

  fetch('/name', {
    method: 'post',
			body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      let name = data["name"];
      setName(name);
    })
    .catch(console.error);
}

function onClickClear() {
  for (const [k,v] of Object.entries(clickedHolds)) {
    toggleHoldState(k, v);
  }
  window.location.search = "";
}

function updatePrefixVisibility(visible) {
  let text = document.getElementById("name-prefix");
  if (visible) {
			text.classList.remove("hide")
			text.classList.add("show")
  } else {
			text.classList.remove("show")
			text.classList.add("hide")
  }

}

function onCheck(event) {
		updatePrefixVisibility(event.currentTarget.checked);
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
  let grade_button = document.getElementById("grade-button");
  grade_button.addEventListener('click', onClickGrade);

  let share_button = document.getElementById("share-button");
  share_button.addEventListener('click', onClickShare);

  let name_button = document.getElementById("name-button");
  name_button.addEventListener('click', onClickName);

  let clear_button = document.getElementById("clear-button");
	clear_button.addEventListener('click', onClickClear);

  let show_prefix_checkbox = document.getElementById("show-prefix-checkbox");
  show_prefix_checkbox.addEventListener('change', onCheck);



  // get anything in the query params
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  for (const [k,v] of Object.entries(params)) {
    // special case for "name"
    if (k=="name") {
      setName(v);
    } else {
      toggleHoldState(k, parseInt(v));
    }
  }
  if (validateHolds()) {
    onClickGrade();
  }

  updatePrefixVisibility(false);
}

window.onload = addCallbacks;
