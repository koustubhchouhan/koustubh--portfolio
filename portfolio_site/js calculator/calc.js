const text = document.getElementById("text");

function appendToDisplay(input) {
  text.value += input;
}

function clearDisplay() {
  text.value = "";
}

function calculate() {
  try {
    text.value = eval(text.value);
  } catch (error) {
    text.value = "error";
  }
}
