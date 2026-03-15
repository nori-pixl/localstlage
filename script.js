const dbName = "MyFileDB";
const storeName = "files";

// 1. データベースを開く（または作成する）
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    // 初めて作成する場合やバージョンが変わる場合
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      db.createObjectStore(storeName, { keyPath: "id" });
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject("DBオープン失敗");
  });
}

// 2. ファイルを保存する
async function saveFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  if (!file) return alert("ファイルを選んでください");

  const db = await openDB();
  const transaction = db.transaction([storeName], "readwrite");
  const store = transaction.objectStore(storeName);

  // ファイルそのもの（Blob形式）を保存できるのがIndexedDBの強み！
  const data = { id: "user-upload", fileData: file, fileName: file.name };
  const request = store.put(data);

  request.onsuccess = () => {
    document.getElementById('status').innerText = "保存完了！";
    loadFile(); // 保存後に表示を更新
  };
}

// 3. ファイルを読み込んで表示する
async function loadFile() {
  const db = await openDB();
  const transaction = db.transaction([storeName], "readonly");
  const store = transaction.objectStore(storeName);
  const request = store.get("user-upload");

  request.onsuccess = (e) => {
    const result = e.target.result;
    if (result) {
      const url = URL.createObjectURL(result.fileData); // BlobをURLに変換
      const preview = document.getElementById('preview');
      
      // 画像なら表示、それ以外ならリンクを作成
      if (result.fileData.type.startsWith("image/")) {
        preview.innerHTML = `<img src="${url}" style="max-width:300px;">`;
      } else {
        preview.innerHTML = `<a href="${url}" download="${result.fileName}">ファイルをダウンロード</a>`;
      }
    }
  };
}

// ページ読み込み時に表示
window.onload = loadFile;
// 保存された画像データをダウンロードする関数
async function downloadImage() {
  const db = await openDB(); // 前の回答で作った関数
  const transaction = db.transaction([storeName], "readonly");
  const store = transaction.objectStore(storeName);
  
  // 保存したID（例: 'user-upload'）でデータを取得
  const request = store.get("user-upload");

  request.onsuccess = (e) => {
    const result = e.target.result;
    if (!result) return alert("保存された画像がありません");

    // 1. 保存されているBlobデータから一時的なURLを作成
    const blob = result.fileData;
    const url = window.URL.createObjectURL(blob);

    // 2. 見えないリンク（<a>タグ）を作ってクリックさせる
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName || "download-image.png"; // 保存時のファイル名を使用
    document.body.appendChild(a);
    a.click();

    // 3. 使い終わったURLを解放してメモリを節約
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };
}

// 画像を表示した際、ダウンロードボタンも表示するように修正
async function loadFile() {
  const db = await openDB();
  const transaction = db.transaction([storeName], "readonly");
  const store = transaction.objectStore(storeName);
  const request = store.get("user-upload");

  request.onsuccess = (e) => {
    const result = e.target.result;
    if (result) {
      const url = URL.createObjectURL(result.fileData);
      const preview = document.getElementById('preview');
      const downloadBtn = document.getElementById('downloadBtn');

      // 画像を表示
      preview.innerHTML = `<img src="${url}" style="max-width:300px; display:block; margin-bottom:10px;">`;
      // ダウンロードボタンを表示
      downloadBtn.style.display = 'block';
    }
  };
}
