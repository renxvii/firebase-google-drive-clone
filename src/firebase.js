// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, getDoc, collection, doc, deleteDoc, updateDoc, query, where, getDocs } from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBg_4Kto7daTupYm6LWnJzdZGR-Wcc8C7w",
  authDomain: "leafpress-drive-ce041.firebaseapp.com",
  databaseURL: "https://leafpress-drive-ce041-default-rtdb.firebaseio.com",
  projectId: "leafpress-drive-ce041",
  storageBucket: "leafpress-drive-ce041.appspot.com",
  messagingSenderId: "245224121151",
  appId: "1:245224121151:web:a0c388c66d916821ae298a",
  measurementId: "G-GYWREFEVM9"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

const folders = collection(firestore, "folders");
const files = collection(firestore, "files");

const formatDoc = (doc) => {
  return { id: doc.id, ...doc.data() };
};

const getCurrentTimestamp = () => new Date();

const deleteFile = async (fileId, filePath) => {
  await deleteDoc(doc(files, fileId));
  await deleteObject(ref(storage, filePath));
};

const deleteFolder = async (folderId) => {
  await deleteDoc(doc(folders, folderId));
};

const updateFileName = async (fileId, newName) => {
  await updateDoc(doc(files, fileId), { name: newName });
};

const updateFolderName = async (folderId, newName) => {
  await updateDoc(doc(folders, folderId), { name: newName });
};

const updateFile = async (fileId, updateData) => {
  await updateDoc(doc(files, fileId), updateData);
};

const updateFolder = async (folderId, updateData) => {
  await updateDoc(doc(folders, folderId), updateData);
};

const derivePath = async (folderId) => {
  const path = [];
  if (folderId) {
    let currentFolder = await getDoc(doc(folders, folderId));
    while (currentFolder.exists() && currentFolder.data().parentId) {
      const parentFolder = await getDoc(doc(folders, currentFolder.data().parentId));
      path.unshift({ name: parentFolder.data().name, id: parentFolder.id });
      currentFolder = parentFolder;
    }
  }
  return path;
};

const updateFolderAndPath = async (folderId, newParentId) => {
  const newPath = await derivePath(newParentId);
  const folderDoc = await getDoc(doc(folders, folderId));
  newPath.push({ name: folderDoc.data().name, id: folderId });

  await updateDoc(doc(folders, folderId), {
    parentId: newParentId,
    path: newPath,
  });

  const q = query(folders, where("parentId", "==", folderId));
  const snapshot = await getDocs(q);

  const promises = snapshot.docs.map(async (childDoc) => {
    await updateFolderAndPath(childDoc.id, folderId);
  });

  await Promise.all(promises);
};


export const database = {
  folders,
  files,
  formatDoc,
  getCurrentTimestamp,
  deleteFile,
  deleteFolder,
  updateFileName,
  updateFolderName,
  updateFile,
  updateFolder,
  updateFolderAndPath,
  derivePath
};

export { auth, storage, firestore };
export default app;