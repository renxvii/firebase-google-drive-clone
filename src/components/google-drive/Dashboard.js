import React from "react";
import { Container } from "react-bootstrap";
import { useFolder } from "../../hooks/useFolder";
import AddFolderButton from "./AddFolderButton";
import AddFileButton from "./AddFileButton";
import Folder from "./Folder";
import File from "./File";
import Navbar from "./Navbar";
import FolderBreadcrumbs from "./FolderBreadcrumbs";
import { useParams, useLocation } from "react-router-dom";
import FolderDropTarget from "./FolderDropTarget";

export default function Dashboard() {
  const { folderId } = useParams();
  const location = useLocation();
  const state = location.state || {};
  const { folder, childFolders, childFiles, loading } = useFolder(folderId, state.folder);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!folder) {
    return <div>Folder not found</div>;
  }

  return (
    <>
      <Navbar />
      <Container fluid>
        <div className="d-flex align-items-center">
          <FolderBreadcrumbs currentFolder={folder} />
          <AddFileButton currentFolder={folder} />
          <AddFolderButton currentFolder={folder} />
        </div>
        {childFolders.length > 0 && (
          <div className="d-flex flex-wrap">
            {childFolders.map((childFolder) => (
              <FolderDropTarget key={childFolder.id} folder={childFolder}>
                <div style={{ maxWidth: "250px" }} className="p-2">
                  <Folder folder={childFolder} />
                </div>
              </FolderDropTarget>
            ))}
          </div>
        )}
        {childFolders.length > 0 && childFiles.length > 0 && <hr />}
        {childFiles.length > 0 && (
          <div className="d-flex flex-wrap">
            {childFiles.map((childFile) => (
              <div key={childFile.id} style={{ maxWidth: "250px" }} className="p-2">
                <File file={childFile} />
              </div>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
