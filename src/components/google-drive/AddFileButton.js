import React, { useState } from "react";
import ReactDOM from "react-dom";
import { faFileUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "../../contexts/AuthContext";
import { storage, database } from "../../firebase";
import { ROOT_FOLDER } from "../../hooks/useFolder";
import { v4 as uuidV4 } from "uuid";
import { ProgressBar, Toast } from "react-bootstrap";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { query, where, getDocs, addDoc, updateDoc } from "firebase/firestore";

export default function AddFileButton({ currentFolder }) {
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const { currentUser } = useAuth();

  function handleUpload(e) {
    const file = e.target.files[0];
    if (currentFolder == null || file == null) return;

    const id = uuidV4();
    setUploadingFiles((prevUploadingFiles) => [
      ...prevUploadingFiles,
      { id, name: file.name, progress: 0, error: false },
    ]);


    const fileRef = ref(storage, `files/${currentUser.uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = snapshot.bytesTransferred / snapshot.totalBytes;
        setUploadingFiles((prevUploadingFiles) =>
          prevUploadingFiles.map((uploadFile) =>
            uploadFile.id === id
              ? { ...uploadFile, progress }
              : uploadFile
          )
        );
      },
      (error) => {
        console.error("Error uploading file:", error);
        setUploadingFiles((prevUploadingFiles) =>
          prevUploadingFiles.map((uploadFile) =>
            uploadFile.id === id ? { ...uploadFile, error: true } : uploadFile
          )
        );
      },
      async () => {
        setUploadingFiles((prevUploadingFiles) =>
          prevUploadingFiles.filter((uploadFile) => uploadFile.id !== id)
        );

        const url = await getDownloadURL(uploadTask.snapshot.ref);
        const filesQuery = query(
          database.files,
          where("name", "==", file.name),
          where("userId", "==", currentUser.uid),
          where("folderId", "==", currentFolder.id)
        );

        const existingFiles = await getDocs(filesQuery);
        const existingFile = existingFiles.docs[0];
        if (existingFile) {
          await updateDoc(existingFile.ref, { url });
        } else {
          await addDoc(database.files, {
            url,
            name: file.name,
            createdAt: database.getCurrentTimestamp(),
            folderId: currentFolder.id,
            userId: currentUser.uid,
          });
        }
      }
    );
  }

  return (
    <>
      <label className="btn btn-outline-success btn-sm m-0 mr-2">
        <FontAwesomeIcon icon={faFileUpload} />
        <input
          type="file"
          onChange={handleUpload}
          style={{ opacity: 0, position: "absolute", left: "-9999px" }}
        />
      </label>
      {uploadingFiles.length > 0 &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "absolute",
              bottom: "1rem",
              right: "1rem",
              maxWidth: "250px",
            }}
          >
            {uploadingFiles.map((file) => (
              <Toast
                key={file.id}
                onClose={() => {
                  setUploadingFiles((prevUploadingFiles) =>
                    prevUploadingFiles.filter(
                      (uploadFile) => uploadFile.id !== file.id
                    )
                  );
                }}
              >
                <Toast.Header
                  closeButton={file.error}
                  className="text-truncate w-100 d-block"
                >
                  {file.name}
                </Toast.Header>
                <Toast.Body>
                  <ProgressBar
                    animated={!file.error}
                    variant={file.error ? "danger" : "primary"}
                    now={file.error ? 100 : file.progress * 100}
                    label={
                      file.error
                        ? "Error"
                        : `${Math.round(file.progress * 100)}%`
                    }
                  />
                </Toast.Body>
              </Toast>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
