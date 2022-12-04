const log = (string) => {
  const logarea = document.getElementById("log");
  logarea.value += string + "\n"
  logarea.scrollTop = logarea.scrollHeight;
}

const result = (string) => {
  const resultarea = document.getElementById("result");
  resultarea.value = string
}

window.onload = () => {
  const redirect_uri = document.getElementById("redirect_uri");
  redirect_uri.value = `https://${chrome.runtime.id}.chromiumapp.org/`

  const copy_redirect_uri_button = document.getElementById("copy_redirect_uri_button");
  copy_redirect_uri_button.onclick = () => {
    redirect_uri.select();
    redirect_uri.setSelectionRange(0, 99999); 
    document.execCommand("copy")

    copy_redirect_uri_button.innerText = "copied!"
    setTimeout(() => {
      copy_redirect_uri_button.innerText = "copy"
    }, 1000);
  }

  const form = document.getElementById("form");
  form.onsubmit = async (e) => {
    e.preventDefault();

    const logarea = document.getElementById("log");
    logarea.value = ""
    const resultarea = document.getElementById("result");
    resultarea.value = ""

    const formData = new FormData(form);
    const map = {}
    for(var pair of formData.entries()) {
        map[pair[0]] = pair[1]
     }
    chrome.runtime.sendMessage({
        action: "submit",
        value: map,
     }, () => {});
  };
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message)
    if (message.action == "log") {
        log(message.value)
    } else if (message.action == "result") {
        result(message.value)
    }
    return true
});