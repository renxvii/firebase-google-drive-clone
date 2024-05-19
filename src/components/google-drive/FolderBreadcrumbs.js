import React, { useEffect, useState } from "react";
import { Breadcrumb } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useDrop } from "react-dnd";
import { ROOT_FOLDER } from "../../hooks/useFolder";
import { database } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";

export default function FolderBreadcrumbs({ currentFolder }) {
  const { currentUser } = useAuth();
  const [path, setPath] = useState([]);

  useEffect(() => {
    const derivePath = async () => {
      if (currentFolder && currentFolder.id !== null) {
        const newPath = await database.derivePath(currentFolder.id);
        setPath(newPath);
      } else {
        setPath([]);
      }
    };

    derivePath();
  }, [currentFolder]);

  const handleDrop = async (item, targetFolder) => {
    if (!currentUser) return;

    if (item.type === "file") {
      await database.updateFile(item.id, { folderId: targetFolder.id || null });
    } else if (item.type === "folder") {
      await database.updateFolderAndPath(item.id, targetFolder.id || null);
    }
  };

  return (
    <Breadcrumb className="flex-grow-1" listProps={{ className: "bg-white pl-0 m-0" }}>
      <BreadcrumbItem
        key="root"
        folder={ROOT_FOLDER}
        handleDrop={handleDrop}
      />
      {path.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <span className="breadcrumb-separator">&nbsp;/&nbsp;</span>
          <BreadcrumbItem
            folder={folder}
            handleDrop={handleDrop}
          />
        </React.Fragment>
      ))}
      {currentFolder && currentFolder.id !== null && (
        <>
          <span className="breadcrumb-separator">&nbsp;/&nbsp;</span>
          <Breadcrumb.Item className="text-truncate d-inline-block" style={{ maxWidth: "200px" }} active>
            {currentFolder.name}
          </Breadcrumb.Item>
        </>
      )}
    </Breadcrumb>
  );
}

function BreadcrumbItem({ folder, handleDrop }) {
  const [{ isOver }, drop] = useDrop({
    accept: ["file", "folder"],
    drop: (item) => handleDrop(item, folder),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <Breadcrumb.Item
      ref={drop}
      className="text-truncate d-inline-block"
      style={{ maxWidth: "150px", border: isOver ? "2px solid blue" : "none" }}
      linkAs={Link}
      linkProps={{
        to: folder.id ? `/folder/${folder.id}` : "/",
      }}
    >
      {folder.name}
    </Breadcrumb.Item>
  );
}
