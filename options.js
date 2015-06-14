
function initOptions() {
    chrome.storage.sync.get("code", function (items) {
        document.getElementById("code").value = items["code"];
    });
}

function saveOptions() {
    var code = document.getElementById("code").value;
    chrome.storage.sync.set({"code": code}, function () {
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
          status.textContent = '';
        }, 1000);
    });
}

window.addEventListener("load", initOptions);
document.getElementById('save').addEventListener('click', saveOptions);