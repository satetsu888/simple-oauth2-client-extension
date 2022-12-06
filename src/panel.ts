const log = (string: string) => {
  const logarea = document.getElementById("log") as HTMLTextAreaElement;
  logarea.value += string + "\n"
  logarea.scrollTop = logarea.scrollHeight;
}

const result = (string: string) => {
  const resultarea = document.getElementById("result") as HTMLTextAreaElement;
  resultarea.value = string
}

window.onload = () => {
  const redirect_uri = document.getElementById("redirect_uri") as HTMLInputElement;
  redirect_uri.value = `https://${chrome.runtime.id}.chromiumapp.org/`

  const copy_redirect_uri_button = document.getElementById("copy_redirect_uri_button") as HTMLButtonElement;
  copy_redirect_uri_button.onclick = () => {
    redirect_uri.select();
    redirect_uri.setSelectionRange(0, 99999); 
    document.execCommand("copy")

    copy_redirect_uri_button.innerText = "copied!"
    setTimeout(() => {
      copy_redirect_uri_button.innerText = "copy"
    }, 1000);
  }

  const form = document.getElementById("form") as HTMLFormElement;
  form.onsubmit = async (e) => {
    e.preventDefault();

    const logarea = document.getElementById("log") as HTMLTextAreaElement;
    logarea.value = ""
    const resultarea = document.getElementById("result") as HTMLTextAreaElement;
    resultarea.value = ""

    const formData = new FormData(form);
    const map: {[key: string]: FormDataEntryValue} = {}
    for(var pair of formData.entries()) {
        map[pair[0]] = pair[1]
     }
    chrome.runtime.sendMessage({
        action: "submit",
        value: buildInputParams(map)
     }, () => {});
  };
};

const buildInputParams = (map: {[key: string]: FormDataEntryValue}): InputParams => {
    const inputParams: InputParams = {
        authorizationEndpoint: map["authorization_endpoint"] as string,
        tokenEndpoint: map["token_endpoint"] as string,
        clientType: map["client_type"] as string,
        clientId: map["client_id"] as string,
        clientSecret: map["client_secret"] as string,
        scope: map["scope"] as string,
        redirectUri: map["redirect_uri"] as string,
        pkceParam: map["pkce"] as PKCEParam ,
        tokenRequestAuth: map["token_request_auth"] as TokenRequestAuth,
    }
    return inputParams
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message)
    if (message.action == "log") {
        log(message.value)
    } else if (message.action == "result") {
        result(message.value)
    }
    return true
});