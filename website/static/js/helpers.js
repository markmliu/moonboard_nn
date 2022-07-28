var hold_type = 2 // 1 is start, 2 is intermediate, 3 is finish
var clicked_holds = {}

function clearContents(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

function updateHoldType(radio) {
  hold_type = parseInt(radio.value);
  console.log("hold_type:", hold_type);
}

function colorForHoldType(hold_type) {
  if (hold_type == 1){
    return "lightgreen";
  } else if (hold_type ==2) {
    return "lightblue";
  }
  return "lightpink";
}

function onClickHold(event) {
  var rect = event.target.getBoundingClientRect();
  var rect_center = [(rect.left + rect.right) / 2, (rect.bottom+rect.top)/2]

  // ignore the click if it's not in quite far in the box
  // toggle the clicked value

  var clicked_on = event.target.classList.toggle('m-clicked')
  if (clicked_on) {
    clicked_holds[event.target.id] = hold_type;
    // set color appropriately
    event.target.style.borderColor = colorForHoldType(hold_type);
    event.target.style.borderRadius = "50%";
    event.target.style.borderWidth = "4px";
    event.target.style.borderStyle = "solid";
  } else {
    delete clicked_holds[event.target.id];
    event.target.style.borderColor = "";
    event.target.style.borderRadius = "";
    event.target.style.borderWidth = "";
    event.target.style.borderStyle = "";
  }
  console.log(clicked_holds);
}

async function gradeButtonCallback() {
  holds = Object.keys(clicked_holds);

  // Validation checking first
  if (holds.length > 12) {
    document.getElementById("predicted_grade").textContent="More than 12 holds selected...";
    return;
  }

  var num_start = 0;
  var num_end = 0;
  for (const [key, val] of Object.entries(clicked_holds)) {
    if (val == 1) {
      num_start++;
    }
    if (val == 3) {
      num_end++;
    }
  }

  if (num_start == 0) {
    document.getElementById("predicted_grade").textContent="No start holds selected";
    return;
  }

  if (num_start > 2) {
    document.getElementById("predicted_grade").textContent="More than 2 start holds selected...";
    return;
  }

  if (num_end == 0) {
    document.getElementById("predicted_grade").textContent="No end holds selected";
    return;
  }

  if (num_end > 2) {
    document.getElementById("predicted_grade").textContent="More than 2 end holds selected...";
  }

  // send "clicked_holds" down to /grade endpoint
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

// TODO: rename the function since we're doing more than adding click callbacks
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
  button.addEventListener('click', gradeButtonCallback);

}

window.onload = addCallbacks;
