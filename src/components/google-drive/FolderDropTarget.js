import React from "react";
import { useDrop } from "react-dnd";
import { database } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import { doc, updateDoc, getDoc } from "firebase/firestore";

export default function FolderDropTarget({ folder, children }) {
  const { currentUser } = useAuth();

  const [{ isOver }, drop] = useDrop({
    accept: ["file", "folder"],
    drop: (item) => handleDrop(item, folder),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  const handleDrop = async (item, targetFolder) => {
    if (!currentUser) return;

    // Prevent dropping a folder into itself or its subfolders
    if (item.type === "folder" && (item.id === targetFolder.id || isSubfolder(item, targetFolder))) {
      console.warn("Cannot drop a folder into itself or its subfolder.");
      return;
    }

    console.log("Dropped item:", item, "onto folder:", targetFolder);

    if (item.type === "file") {
        await updateDoc(doc(database.files, item.id), {
          folderId: targetFolder.id || null,
        });
      } else if (item.type === "folder") {
        const newPath = targetFolder.path ? [...targetFolder.path] : [];
        if (targetFolder.id !== null) {
          newPath.push({ name: targetFolder.name, id: targetFolder.id });
        }
        await updateDoc(doc(database.folders, item.id), {
          id: item.id,
          parentId: targetFolder.id || null,
          path: newPath,
        });
      }
    };

  const isSubfolder = (item, targetFolder) => {
    const itemPath = item.path || [];
    return itemPath.some(folder => folder.id === targetFolder.id);
  };

  return (
    <div ref={drop} style={{ border: isOver ? "2px solid blue" : "none" }}>
      {children}
    </div>
  );
}
