(() => {
  'use strict';
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function layer(title) {
    document.getElementById('reset-fallback')?.remove();
    const dialog=document.createElement('dialog');dialog.id='reset-fallback';dialog.setAttribute('aria-label',title);
    dialog.innerHTML=`<h2>${escape(title)}</h2><div class="reset-fallback-content"></div><button type="button" class="g-secondary">關閉</button>`;
    document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();return dialog.querySelector('.reset-fallback-content');
  }
  function manual(text,title='請手動複製下方文字') {
    const content=layer(title);const label=document.createElement('label');label.textContent='已選取文字，可長按或用鍵盤複製。';
    const box=document.createElement('textarea');box.value=text;box.readOnly=true;box.id='reset-copy';label.htmlFor=box.id;content.append(label,box);box.focus();box.select();return false;
  }
  async function copy(text) {
    try{if(typeof navigator.clipboard?.writeText!=='function')throw Error();await navigator.clipboard.writeText(text);return true;}catch{return manual(text);}
  }
  function imagePreview(canvas) {
    const content=layer('長按圖片即可儲存');const img=document.createElement('img');img.src=canvas.toDataURL('image/png');img.alt=canvas.getAttribute('aria-label')||'圖片卡預覽';content.append(img);
    const note=document.createElement('p');note.textContent='若沒有儲存選項，可截圖保存。圖片留在此頁，不會自動上傳。';content.append(note);
  }
  function download(filename,blob) {
    let url;
    try{url=URL.createObjectURL(blob);const a=document.createElement('a');if(!('download'in a))throw Error();a.href=url;a.download=filename;a.textContent='下載';document.body.append(a);try{a.click();}finally{a.remove();}return true;}
    catch{document.dispatchEvent(new Event('reset:download-failed'));return false;}
    finally{if(url)setTimeout(()=>URL.revokeObjectURL(url),30000);}
  }
  function storageAvailable() {
    try{const key='one-day-reset-storage-probe';localStorage.setItem(key,'1');const ok=localStorage.getItem(key)==='1';localStorage.removeItem(key);return ok;}catch{return false;}
  }
  window.ResetLocalUI=Object.freeze({copy,manual,imagePreview,download,storageAvailable});
})();
