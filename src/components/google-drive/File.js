import React, { useState } from "react";
import { useDrag } from "react-dnd";
import { useAuth } from "../../contexts/AuthContext";
import { database } from "../../firebase";
import { Button, Form, Modal, Card } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAlt, faTrash, faEdit, faFilePdf, faFileWord, faFileExcel,
  faFilePowerpoint, faFileImage, faFileVideo, faFileAudio, faFileArchive, faFileCode
} from "@fortawesome/free-solid-svg-icons";
import "./FileandFolder.css"; // Import the CSS file

export default function File({ file }) {
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "file",
    item: { ...file, type: "file" },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const handleDelete = async () => {
    
    
    const filePath = `files/${currentUser.uid}/${file.name}`;
    await database.deleteFile(file.id, filePath);


    
  };

  const handleRename = async (e) => {
    e.preventDefault();
    await database.updateFileName(file.id, newName);
    setShowModal(false);
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return faFilePdf;
      case 'doc':
      case 'docx':
        return faFileWord;
      case 'xls':
      case 'xlsx':
        return faFileExcel;
      case 'ppt':
      case 'pptx':
        return faFilePowerpoint;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return faFileImage;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return faFileVideo;
      case 'mp3':
      case 'wav':
      case 'ogg':
        return faFileAudio;
      case 'zip':
      case 'rar':
      case '7z':
        return faFileArchive;
      case 'html':
      case 'css':
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'json':
      case 'xml':
        return faFileCode;
      default:
        return faFileAlt;
    }
  };

  return (
    <div className="container-wrapper">
      <div ref={drag} className="item-container" style={{ opacity: isDragging ? 0.5 : 1 }} key={file.id}>
        <Card className="item-card">
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`item-link ${file.name.length > 30 ? 'multiline' : ''}`}
          >
            <Card.Body className="d-flex align-items-center">
              <div className="item-info">
                <FontAwesomeIcon icon={getFileIcon(file.name)} size="2x" className="item-icon" />
                <div className="item-text">{file.name}</div>
              </div>
            </Card.Body>
          </a>
          <div className="item-actions">
            <Button
              variant="secondary"
              size="sm"
              className="mr-2"
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(file.id);
                setNewName(file.name);
              }}
            >
              <FontAwesomeIcon icon={faEdit} />
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </div>
        </Card>

        <Modal show={showModal === file.id} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Rename File</Modal.Title>
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
