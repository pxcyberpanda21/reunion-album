import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import { useState, useEffect } from "react";

const firebaseConfig = {
  apiKey: "AIzaSyCMsKoiZvyr-l_118ejp4NFdd1utzeVBOg",
  authDomain: "ndpics-9adf7.firebaseapp.com",
  projectId: "ndpics-9adf7",
  storageBucket: "ndpics-9adf7.firebasestorage.app",
  messagingSenderId: "605389402511",
  appId: "1:605389402511:web:6768e203ddcdfb71e7dbfa"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

const PASSWORD = "reunion2025";

function App() {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [name, setName] = useState("");

  useEffect(() => {
    if (authed) loadPhotos();
  }, [authed]);

  async function loadPhotos() {
    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function handleUpload() {
    if (!files.length || !name) return;
    setUploading(true);
    let done = 0;
    for (const file of files) {
      const storageRef = ref(storage, `photos/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, "photos"), {
        url,
        name,
        createdAt: Date.now(),
        path: storageRef.fullPath
      });
      done++;
      setProgress(Math.round((done / files.length) * 100));
    }
    setFiles([]);
    setProgress(0);
    setUploading(false);
    loadPhotos();
  }

  if (!authed) {
    return (
      <div style={styles.center}>
        <div style={styles.loginBox}>
          <h2 style={styles.title}>同窓会アルバム</h2>
          <p style={styles.sub}>合言葉を入力してください</p>
          <input
            style={styles.input}
            type="password"
            placeholder="合言葉"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && input === PASSWORD && setAuthed(true)}
          />
          <button
            style={styles.btn}
            onClick={() => input === PASSWORD && setAuthed(true)}
          >
            入室する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>同窓会アルバム</h1>
        <span style={styles.badge}>参加者限定</span>
      </div>

      <div style={styles.main}>
        <div style={styles.uploadBox}>
          <input
            style={styles.input}
            placeholder="あなたの名前"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <label style={styles.fileLabel}>
            📷 写真を選ぶ（複数可）
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={e => setFiles(Array.from(e.target.files))}
            />
          </label>
          {files.length > 0 && (
            <p style={styles.fileCount}>{files.length}枚選択中</p>
          )}
          {uploading && (
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
          )}
          <button
            style={styles.btn}
            onClick={handleUpload}
            disabled={uploading || !files.length || !name}
          >
            {uploading ? `アップロード中... ${progress}%` : `${files.length || 0}枚をアップロード`}
          </button>
        </div>

        <div style={styles.gallery}>
          {photos.map(p => (
            <div key={p.id} style={styles.card}>
              <img src={p.url} alt={p.name} style={styles.photo} />
              <div style={styles.cardInfo}>
                <span style={styles.cardName}>{p.name}</span>
                <a href={p.url} download style={styles.dlBtn}>⬇</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  center: { display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f5f5f0" },
  loginBox: { background:"white", padding:"32px", borderRadius:"16px", textAlign:"center", width:"280px" },
  title: { fontSize:"20px", fontWeight:"500", marginBottom:"8px" },
  sub: { fontSize:"13px", color:"#888", marginBottom:"16px" },
  input: { width:"100%", padding:"10px 12px", borderRadius:"8px", border:"1px solid #ddd", fontSize:"14px", marginBottom:"10px", boxSizing:"border-box" },
  btn: { width:"100%", padding:"10px", borderRadius:"8px", background:"#7F77DD", color:"white", border:"none", fontSize:"14px", fontWeight:"500", cursor:"pointer" },
  app: { minHeight:"100vh", background:"#f5f5f0" },
  header: { background:"white", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #eee" },
  headerTitle: { fontSize:"16px", fontWeight:"500" },
  badge: { fontSize:"11px", padding:"3px 10px", borderRadius:"20px", background:"#EEEDFE", color:"#3C3489" },
  main: { padding:"16px 20px" },
  uploadBox: { background:"white", borderRadius:"12px", padding:"16px", marginBottom:"16px" },
  fileLabel: { display:"block", padding:"10px", borderRadius:"8px", border:"1.5px dashed #ddd", textAlign:"center", cursor:"pointer", fontSize:"13px", color:"#666", marginBottom:"8px" },
  fileCount: { fontSize:"12px", color:"#7F77DD", marginBottom:"8px", textAlign:"center" },
  progressBar: { background:"#eee", borderRadius:"10px", height:"6px", marginBottom:"8px" },
  progressFill: { background:"#7F77DD", height:"6px", borderRadius:"10px", transition:"width 0.3s" },
  gallery: { display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"8px" },
  card: { borderRadius:"8px", overflow:"hidden", background:"white", border:"1px solid #eee" },
  photo: { width:"100%", aspectRatio:"1", objectFit:"cover", display:"block" },
  cardInfo: { padding:"6px 8px", display:"flex", alignItems:"center", justifyContent:"space-between" },
  cardName: { fontSize:"11px", color:"#666" },
  dlBtn: { fontSize:"16px", textDecoration:"none" }
};

export default App;