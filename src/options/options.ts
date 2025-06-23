function save_options() {
  const token = (document.getElementById('token') as HTMLInputElement).value;
  chrome.storage.sync.set({
    github_token: token
  }, function() {
    const status = document.getElementById('status') as HTMLDivElement;
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

function restore_options() {
  chrome.storage.sync.get({
    github_token: ''
  }, function(items) {
    (document.getElementById('token') as HTMLInputElement).value = items.github_token;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
(document.getElementById('save') as HTMLButtonElement).addEventListener('click', save_options); 