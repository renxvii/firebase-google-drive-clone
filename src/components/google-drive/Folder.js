import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Modal, Form, Card } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit, faFolder } from "@fortawesome/free-solid-svg-icons";
import { database } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useDrag } from "react-dnd";
import { getFirestore, getDoc, collection, doc, deleteDoc, updateDoc, query, where, getDocs } from "firebase/firestore";

import "./FileandFolder.css"; // Import the CSS file

export default function Folder({ folder }) {
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "folder",
    item: { ...folder, type: "folder" },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const handleDelete = async (folderId) => {
    if (!folderId) {
      console.error("Invalid folderId: ", folderId);
      return;
    }
  
    try {
      console.log("Deleting folder with ID: ", folderId);
  
      // Deleting files in the folder
      const filesQuery = query(database.files, where("folderId", "==", folderId));
      const filesSnapshot = await getDocs(filesQuery);
  
      await Promise.all(filesSnapshot.docs.map(async (fileDoc) => {
        const fileData = fileDoc.data();
        console.log("Deleting file: ", fileData);
  
        const filePath = `files/${currentUser.uid}/${fileData.name}`;
        
        await database.deleteFile(fileDoc.id, filePath);
      }));
  
      // Deleting subfolders recursively
      const foldersQuery = query(database.folders, where("parentId", "==", folderId));
      const foldersSnapshot = await getDocs(foldersQuery);
  
      await Promise.all(foldersSnapshot.docs.map(async (subFolderDoc) => {
        const subFolderData = subFolderDoc.data();
        if (subFolderData && subFolderData.id) {
          console.log("Deleting subfolder: ", subFolderData.id);
          await handleDelete(subFolderData.id); // Recursive call
        } else {
          console.error("Subfolder data or ID is invalid: ", subFolderData);
        }
      }));
  
      // Finally delete the folder itself
      await database.deleteFolder(folderId);
      console.log("Folder deleted: ", folderId);
    } catch (error) {
      console.error("Error deleting folder: ", error);
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    await database.updateFolderName(folder.id, newName);
    setShowModal(false);
  };

  return (
    <div className="container-wrapper">
      <div ref={drag} className="item-container" style={{ opacity: isDragging ? 0.5 : 1 }} key={folder.id}>
        <Card className="item-card">
          <Link
            to={{
              pathname: `/folder/${folder.id}`,
              state: { folder: folder },
            }}
            className={`item-link ${folder.name.length > 30 ? 'multiline' : ''}`}
          >
            <Card.Body className="d-flex align-items-center">
              <FontAwesomeIcon icon={faFolder} size="2x" className="folder-icon" />
              <div className="item-info">
                <div className="item-text">{folder.name}</div>
              </div>
            </Card.Body>
          </Link>
          <div className="item-actions">
            <Button
              variant="secondary"
              size="sm"
              className="mr-2"
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
            >
              <FontAwesomeIcon icon={faEdit} />
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(folder.id);
              }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </div>
        </Card>

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Rename Folder</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleRename}>
              <Form.Group>
                <Form.Label>New Name</Form.Label>
                <Form.Control
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </Form.Group>
              <Button variant="primary" type="submit">
                Save
              </Button>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
}
